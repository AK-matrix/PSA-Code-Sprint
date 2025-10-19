# Hybrid Search Upgrade for LangGraph Workflow

## Overview

This document describes the upgrade of the core RAG retrieval mechanism to a powerful **Hybrid Search** model that combines semantic vector search with keyword search for enhanced accuracy.

## Key Features

### 🔍 **Dual Search Strategy**
- **Semantic Search**: Vector similarity search for broad contextual understanding
- **Keyword Search**: Entity-based search for precise technical matches
- **Intelligent Synthesis**: Combines both approaches for optimal results

### 🧠 **Enhanced Analysis**
- **Context-Aware Prompting**: LLM receives both semantic and keyword context
- **Confidence Scoring**: Dynamic confidence based on search method alignment
- **Deduplication**: Smart combination of results without duplicates

## Implementation Details

### 1. **Hybrid Search Retrieval** (`_retrieve_candidate_sops`)

```python
def _retrieve_candidate_sops(self, alert_text: str, module: str, entities: List[str] = None) -> List[Dict]:
    """Retrieve candidate SOPs using Hybrid Search (Semantic + Keyword)"""
```

**Process Flow:**
1. **Semantic Search**: Vector similarity search (top 2 results)
2. **Keyword Search**: Entity-based search using extracted keywords (top 2 results)
3. **Combination**: Deduplicate and rank by relevance score
4. **Fallback**: Graceful degradation to simple semantic search

**Key Features:**
- Parallel execution of both search methods
- Intelligent fallback for keyword search failures
- Relevance scoring for result ranking
- Search type tracking for analysis context

### 2. **Enhanced Diagnostic Analysis** (`_perform_diagnostic_analysis`)

```python
def _perform_diagnostic_analysis(self, alert_text: str, candidate_sops: List[Dict], entities: List[str] = None) -> Dict:
    """Perform diagnostic analysis using LLM with Hybrid Search context"""
```

**Enhanced Prompt Structure:**
- **Semantic Context**: Broad understanding from vector search
- **Keyword Context**: Precise technical matches from entity search
- **Synthesis Instructions**: Clear guidance for combining both perspectives
- **Confidence Scoring**: Dynamic confidence based on search alignment

### 3. **Diagnostic Node Integration**

The diagnostic node now:
- Passes entities from triage to hybrid search
- Uses enhanced analysis with dual search context
- Provides better confidence scoring
- Maintains backward compatibility

## Search Method Comparison

| Aspect | Semantic Search | Keyword Search | Hybrid Search |
|--------|----------------|----------------|---------------|
| **Purpose** | Broad contextual understanding | Precise technical matches | Combined accuracy |
| **Input** | Full alert text | Extracted entities | Both approaches |
| **Results** | Top 2 semantic matches | Top 2 keyword matches | Deduplicated combined |
| **Context** | General problem understanding | Specific technical details | Comprehensive analysis |
| **Confidence** | Based on vector similarity | Based on exact matches | Dynamic based on alignment |

## Benefits

### 🎯 **Enhanced Accuracy**
- **Semantic Understanding**: Captures broad problem context
- **Technical Precision**: Matches specific error codes and entities
- **Combined Intelligence**: Best of both approaches

### 🚀 **Improved Performance**
- **Parallel Processing**: Both searches run simultaneously
- **Smart Fallbacks**: Graceful degradation on failures
- **Efficient Deduplication**: No duplicate results

### 🧠 **Better Analysis**
- **Context-Rich Prompts**: LLM receives comprehensive context
- **Dynamic Confidence**: Scoring based on search method alignment
- **Enhanced Reasoning**: More detailed explanations

## Usage Examples

### Basic Hybrid Search
```python
# Entities extracted by triage node
entities = ["EDI_ERR_1", "REF-IFT-0007", "edi_advice_service"]

# Hybrid search with entities
candidate_sops = workflow._retrieve_candidate_sops(
    alert_text=alert_text,
    module="EDI/API",
    entities=entities
)
```

### Enhanced Analysis
```python
# Diagnostic analysis with hybrid context
diagnostic_result = workflow._perform_diagnostic_analysis(
    alert_text=alert_text,
    candidate_sops=candidate_sops,
    entities=entities
)
```

## Configuration

### Search Parameters
- **Semantic Results**: 2 results (configurable)
- **Keyword Results**: 2 results (configurable)
- **Content Preview**: 800 characters for analysis
- **Relevance Scoring**: 1 - distance for ranking

### Fallback Behavior
- **Keyword Search Failure**: Falls back to individual entity searches
- **Complete Failure**: Falls back to simple semantic search
- **No Entities**: Uses only semantic search

## Testing

Run the test script to verify functionality:

```bash
python test_hybrid_search.py
```

**Test Coverage:**
- Hybrid search retrieval
- Enhanced diagnostic analysis
- Full workflow integration
- Error handling and fallbacks

## Performance Impact

### Positive Impacts
- **Better Accuracy**: More relevant SOP matches
- **Enhanced Context**: Richer analysis for LLM
- **Improved Confidence**: More accurate confidence scoring

### Considerations
- **Slight Overhead**: Additional search operations
- **Memory Usage**: Storing search type metadata
- **Processing Time**: Minimal increase due to parallel execution

## Migration Notes

### Backward Compatibility
- **Existing Code**: No changes required
- **API Compatibility**: Same interface maintained
- **Fallback Support**: Graceful degradation on errors

### New Features
- **Entity Support**: Pass entities for keyword search
- **Enhanced Prompts**: Better analysis context
- **Search Metadata**: Track search types and scores

## Future Enhancements

### Potential Improvements
- **Weighted Scoring**: Custom weights for semantic vs keyword
- **Entity Extraction**: Automatic entity extraction from alerts
- **Search Analytics**: Track search method effectiveness
- **Adaptive Thresholds**: Dynamic result filtering

### Advanced Features
- **Multi-Modal Search**: Image and text search
- **Temporal Context**: Time-based search relevance
- **User Feedback**: Learning from search result effectiveness

## Conclusion

The Hybrid Search upgrade significantly enhances the RAG retrieval mechanism by combining the strengths of semantic and keyword search approaches. This results in more accurate SOP matching, better analysis context, and improved overall system performance.

The implementation maintains full backward compatibility while providing substantial improvements in accuracy and analysis quality.

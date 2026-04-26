"""
ZepSearch tool service
Encapsulates graph search, node reading, edge query and other tools for use by Report Agent

Core search tools (after optimization):
1. InsightForge (deep insight search) - the most powerful hybrid search, automatically generates sub-questions and multi-dimensional search
2. PanoramaSearch - Get the full picture, including expired content
3. QuickSearch - Quick search
"""

import time
import json
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

from zep_cloud.client import Zep

from ..config import Config
from ..utils.logger import get_logger
from ..utils.llm_client import LLMClient
from ..utils.locale import get_locale, t
from ..utils.zep_paging import fetch_all_nodes, fetch_all_edges

logger = get_logger('mirollama.zep_tools')


@dataclass
class SearchResult:
    """Search results"""
    facts: List[str]
    edges: List[Dict[str, Any]]
    nodes: List[Dict[str, Any]]
    query: str
    total_count: int
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "facts": self.facts,
            "edges": self.edges,
            "nodes": self.nodes,
            "query": self.query,
            "total_count": self.total_count
        }
    
    def to_text(self) -> str:
        """Convert to text format for LLM to understand"""
        text_parts = [f"search query: {self.query}", f"turn up {self.total_count} related information"]
        
        if self.facts:
            text_parts.append("\n### Relevant facts:")
            for i, fact in enumerate(self.facts, 1):
                text_parts.append(f"{i}. {fact}")
        
        return "\n".join(text_parts)


@dataclass
class NodeInfo:
    """Node information"""
    uuid: str
    name: str
    labels: List[str]
    summary: str
    attributes: Dict[str, Any]
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "uuid": self.uuid,
            "name": self.name,
            "labels": self.labels,
            "summary": self.summary,
            "attributes": self.attributes
        }
    
    def to_text(self) -> str:
        """Convert to text format"""
        entity_type = next((l for l in self.labels if l not in ["Entity", "Node"]), "unknown type")
        return f"entity: {self.name} (type: {entity_type})\nsummary: {self.summary}"


@dataclass
class EdgeInfo:
    """side information"""
    uuid: str
    name: str
    fact: str
    source_node_uuid: str
    target_node_uuid: str
    source_node_name: Optional[str] = None
    target_node_name: Optional[str] = None
    # time information
    created_at: Optional[str] = None
    valid_at: Optional[str] = None
    invalid_at: Optional[str] = None
    expired_at: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "uuid": self.uuid,
            "name": self.name,
            "fact": self.fact,
            "source_node_uuid": self.source_node_uuid,
            "target_node_uuid": self.target_node_uuid,
            "source_node_name": self.source_node_name,
            "target_node_name": self.target_node_name,
            "created_at": self.created_at,
            "valid_at": self.valid_at,
            "invalid_at": self.invalid_at,
            "expired_at": self.expired_at
        }
    
    def to_text(self, include_temporal: bool = False) -> str:
        """Convert to text format"""
        source = self.source_node_name or self.source_node_uuid[:8]
        target = self.target_node_name or self.target_node_uuid[:8]
        base_text = f"relation: {source} --[{self.name}]--> {target}\nfact: {self.fact}"
        
        if include_temporal:
            valid_at = self.valid_at or "unknown"
            invalid_at = self.invalid_at or "to date"
            base_text += f"\naging: {valid_at} - {invalid_at}"
            if self.expired_at:
                base_text += f" (Expired: {self.expired_at})"
        
        return base_text
    
    @property
    def is_expired(self) -> bool:
        """Has it expired?"""
        return self.expired_at is not None
    
    @property
    def is_invalid(self) -> bool:
        """Has it expired?"""
        return self.invalid_at is not None


@dataclass
class InsightForgeResult:
    """
    Deep insights into search results (InsightForge)
    Contains search results for multiple sub-questions and comprehensive analysis
    """
    query: str
    simulation_requirement: str
    sub_queries: List[str]
    
    # Search results for each dimension
    semantic_facts: List[str] = field(default_factory=list)  # Semantic search results
    entity_insights: List[Dict[str, Any]] = field(default_factory=list)  # entity insights
    relationship_chains: List[str] = field(default_factory=list)  # relationship chain
    
    # Statistics
    total_facts: int = 0
    total_entities: int = 0
    total_relationships: int = 0
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "query": self.query,
            "simulation_requirement": self.simulation_requirement,
            "sub_queries": self.sub_queries,
            "semantic_facts": self.semantic_facts,
            "entity_insights": self.entity_insights,
            "relationship_chains": self.relationship_chains,
            "total_facts": self.total_facts,
            "total_entities": self.total_entities,
            "total_relationships": self.total_relationships
        }
    
    def to_text(self) -> str:
        """Convert to detailed text format for LLM to understand"""
        text_parts = [
            f"## In-depth analysis of future forecasts",
            f"Analyze the problem: {self.query}",
            f"Prediction scenarios: {self.simulation_requirement}",
            f"\n### Forecast statistics",
            f"- Relevant prediction facts: {self.total_facts}strip",
            f"- Involved entities: {self.total_entities}indivual",
            f"- relationship chain: {self.total_relationships}strip"
        ]
        
        # subproblem
        if self.sub_queries:
            text_parts.append(f"\n### Analytical sub-problems")
            for i, sq in enumerate(self.sub_queries, 1):
                text_parts.append(f"{i}. {sq}")
        
        # Semantic search results
        if self.semantic_facts:
            text_parts.append(f"\n### [Key facts](Please cite these original texts in your report)")
            for i, fact in enumerate(self.semantic_facts, 1):
                text_parts.append(f"{i}. \"{fact}\"")
        
        # entity insights
        if self.entity_insights:
            text_parts.append(f"\n### [Core entities]")
            for entity in self.entity_insights:
                text_parts.append(f"- **{entity.get('name', 'unknown')}** ({entity.get('type', 'entity')})")
                if entity.get('summary'):
                    text_parts.append(f"  summary: \"{entity.get('summary')}\"")
                if entity.get('related_facts'):
                    text_parts.append(f"  Relevant facts: {len(entity.get('related_facts', []))}strip")
        
        # relationship chain
        if self.relationship_chains:
            text_parts.append(f"\n### [Relationship chains]")
            for chain in self.relationship_chains:
                text_parts.append(f"- {chain}")
        
        return "\n".join(text_parts)


@dataclass
class PanoramaResult:
    """
    Breadth search results (Panorama)
    Contains all relevant information, including expired content
    """
    query: str
    
    # All nodes
    all_nodes: List[NodeInfo] = field(default_factory=list)
    # All edges (including expired ones)
    all_edges: List[EdgeInfo] = field(default_factory=list)
    # Current facts
    active_facts: List[str] = field(default_factory=list)
    # Expired/Invalid facts (history)
    historical_facts: List[str] = field(default_factory=list)
    
    # statistics
    total_nodes: int = 0
    total_edges: int = 0
    active_count: int = 0
    historical_count: int = 0
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "query": self.query,
            "all_nodes": [n.to_dict() for n in self.all_nodes],
            "all_edges": [e.to_dict() for e in self.all_edges],
            "active_facts": self.active_facts,
            "historical_facts": self.historical_facts,
            "total_nodes": self.total_nodes,
            "total_edges": self.total_edges,
            "active_count": self.active_count,
            "historical_count": self.historical_count
        }
    
    def to_text(self) -> str:
        """Convert to text format (full version, not truncated)"""
        text_parts = [
            f"## Breadth of search results (panoramic view of the future)",
            f"Query: {self.query}",
            f"\n### Statistics",
            f"- Total number of nodes: {self.total_nodes}",
            f"- total number of edges: {self.total_edges}",
            f"- current valid facts: {self.active_count}strip",
            f"- history/expired fact: {self.historical_count}strip"
        ]
        
        # Currently valid facts (complete output, not truncated)
        if self.active_facts:
            text_parts.append(f"\n### [Current valid facts](Original simulation results)")
            for i, fact in enumerate(self.active_facts, 1):
                text_parts.append(f"{i}. \"{fact}\"")
        
        # history/Expired facts (complete output, no truncation)
        if self.historical_facts:
            text_parts.append(f"\n### [Historical / expired facts](Evolution process record)")
            for i, fact in enumerate(self.historical_facts, 1):
                text_parts.append(f"{i}. \"{fact}\"")
        
        # Key entities (complete output, no truncation)
        if self.all_nodes:
            text_parts.append(f"\n### [Involved entities]")
            for node in self.all_nodes:
                entity_type = next((l for l in node.labels if l not in ["Entity", "Node"]), "entity")
                text_parts.append(f"- **{node.name}** ({entity_type})")
        
        return "\n".join(text_parts)


@dataclass
class AgentInterview:
    """Interview results of a single Agent"""
    agent_name: str
    agent_role: str  # Role type (e.g. student, teacher, media, etc.)
    agent_bio: str  # Introduction
    question: str  # interview questions
    response: str  # Interview answers
    key_quotes: List[str] = field(default_factory=list)  # Key Quotes
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "agent_name": self.agent_name,
            "agent_role": self.agent_role,
            "agent_bio": self.agent_bio,
            "question": self.question,
            "response": self.response,
            "key_quotes": self.key_quotes
        }
    
    def to_text(self) -> str:
        text = f"**{self.agent_name}** ({self.agent_role})\n"
        # Display the complete agent_bio without truncation
        text += f"_Introduction: {self.agent_bio}_\n\n"
        text += f"**Q:** {self.question}\n\n"
        text += f"**A:** {self.response}\n"
        if self.key_quotes:
            text += "\n**Key Quotes:**\n"
            for quote in self.key_quotes:
                # Clean up various quotes
                clean_quote = quote.replace('\u201c', '').replace('\u201d', '').replace('"', '')
                clean_quote = clean_quote.replace('\u300c', '').replace('\u300d', '')
                clean_quote = clean_quote.strip()
                # Remove the leading punctuation
                while clean_quote and clean_quote[0] in ',,;;::,. ! ?\n\r\t ':
                    clean_quote = clean_quote[1:]
                import re as _re
                if _re.match(r'^\s*([1-9][\).:])\s+', clean_quote):
                    continue
                if _re.search(r'\b(question|q)\s*([1-9])\b', clean_quote, _re.IGNORECASE):
                    continue
                # Truncate overly long content (truncate by periods, not hard truncation)
                if len(clean_quote) > 150:
                    dot_pos = clean_quote.find('.', 80)
                    if dot_pos <= 0:
                        dot_pos = clean_quote.find('\u3002', 80)
                    if dot_pos > 0:
                        clean_quote = clean_quote[:dot_pos + 1]
                    else:
                        clean_quote = clean_quote[:147] + "..."
                if clean_quote and len(clean_quote) >= 10:
                    text += f'> "{clean_quote}"\n'
        return text


@dataclass
class InterviewResult:
    """
    Interview results (Interview)
    Contains interview answers from multiple simulated agents
    """
    interview_topic: str  # Interview topics
    interview_questions: List[str]  # List of interview questions
    
    # Interview selectedAgent
    selected_agents: List[Dict[str, Any]] = field(default_factory=list)
    # Interview responses from each Agent
    interviews: List[AgentInterview] = field(default_factory=list)
    
    # Reasons for choosing Agent
    selection_reasoning: str = ""
    # Consolidated interview summary
    summary: str = ""
    
    # statistics
    total_agents: int = 0
    interviewed_count: int = 0
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "interview_topic": self.interview_topic,
            "interview_questions": self.interview_questions,
            "selected_agents": self.selected_agents,
            "interviews": [i.to_dict() for i in self.interviews],
            "selection_reasoning": self.selection_reasoning,
            "summary": self.summary,
            "total_agents": self.total_agents,
            "interviewed_count": self.interviewed_count
        }
    
    def to_text(self) -> str:
        """Converted to detailed text format for LLM understanding and report citation"""
        text_parts = [
            "## In-depth interview report",
            f"**Interview topics:** {self.interview_topic}",
            f"**Number of interviews:** {self.interviewed_count} / {self.total_agents} bit simulationAgent",
            "\n### Reasons for selecting interviewees",
            self.selection_reasoning or "(automatically selected)",
            "\n---",
            "\n### Interview transcript",
        ]

        if self.interviews:
            for i, interview in enumerate(self.interviews, 1):
                text_parts.append(f"\n#### interview #{i}: {interview.agent_name}")
                text_parts.append(interview.to_text())
                text_parts.append("\n---")
        else:
            text_parts.append("(No interview record)\n\n---")

        text_parts.append("\n### Interview summary and key points")
        text_parts.append(self.summary or "(no abstract)")

        return "\n".join(text_parts)


class ZepToolsService:
    """
    ZepSearch tool service
    
    [Core Search Tool - After Optimization]
    1. insight_forge - in-depth insight retrieval (the most powerful, automatically generates sub-questions, multi-dimensional retrieval)
    2. panorama_search - Breadth search (get the whole picture, including expired content)
    3. quick_search - simple search (quick retrieval)
    4. interview_agents - in-depth interviews (interview simulated agents to obtain multiple perspectives)
    
    Basic tools:
    - search_graph - Graph semantic search
    - get_all_nodes - Get all nodes of the graph
    - get_all_edges - Get all edges of the graph (including time information)
    - get_node_detail - Get node details
    - get_node_edges - Get edges related to nodes
    - get_entities_by_type - Get entities by type
    - get_entity_summary - Gets the relationship summary of an entity
    """
    
    # Retry configuration
    MAX_RETRIES = 3
    RETRY_DELAY = 2.0
    
    def __init__(self, api_key: Optional[str] = None, llm_client: Optional[LLMClient] = None):
        self.search_provider = (Config.SEARCH_PROVIDER or 'none').lower()
        self.searxng_base_url = (Config.SEARXNG_BASE_URL or '').rstrip('/')
        self.api_key = api_key or Config.ZEP_API_KEY
        self.client = None

        if self.search_provider == 'zep':
            if not self.api_key:
                raise ValueError("ZEP_API_KEY is not configured")
            self.client = Zep(api_key=self.api_key)

        # LLMClient used by InsightForge to generate sub-questions
        self._llm_client = llm_client
        logger.info(f"Search tools initialized with provider={self.search_provider}")
    
    @property
    def llm(self) -> LLMClient:
        """Lazy initialization of LLM client"""
        if self._llm_client is None:
            self._llm_client = LLMClient()
        return self._llm_client

    def _is_zep_enabled(self) -> bool:
        return self.search_provider == 'zep' and self.client is not None

    def _is_searxng_enabled(self) -> bool:
        return self.search_provider == 'searxng'

    def _empty_search_result(self, query: str) -> SearchResult:
        return SearchResult(
            facts=[],
            edges=[],
            nodes=[],
            query=query,
            total_count=0
        )

    def _search_with_searxng(self, query: str, limit: int) -> List[str]:
        if not self.searxng_base_url:
            logger.warning("SEARXNG_BASE_URL is empty while SEARCH_PROVIDER=searxng")
            return []

        params = {
            "q": query,
            "format": "json",
            "language": Config.WEB_SEARCH_LANGUAGE,
            "safesearch": 0,
        }
        url = f"{self.searxng_base_url}/search?{urlencode(params)}"

        try:
            req = Request(url=url, headers={"User-Agent": "mirollama/1.0"})
            with urlopen(req, timeout=10) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except (URLError, HTTPError, TimeoutError, json.JSONDecodeError) as e:
            logger.warning(f"SearXNG request failed: {e}")
            return []

        facts: List[str] = []
        for item in payload.get("results", [])[:limit]:
            title = (item.get("title") or "").strip()
            content = (item.get("content") or "").strip()
            result_url = (item.get("url") or "").strip()
            if title and content and result_url:
                facts.append(f"{title}: {content} ({result_url})")
            elif title and result_url:
                facts.append(f"{title} ({result_url})")
            elif content:
                facts.append(content)

        return facts

    def _panorama_from_facts(self, query: str, facts: List[str]) -> PanoramaResult:
        result = PanoramaResult(query=query)
        result.active_facts = facts
        result.historical_facts = []
        result.total_nodes = 0
        result.total_edges = 0
        result.active_count = len(facts)
        result.historical_count = 0
        return result
    
    def _call_with_retry(self, func, operation_name: str, max_retries: int = None):
        """API calls with retry mechanism"""
        max_retries = max_retries or self.MAX_RETRIES
        last_exception = None
        delay = self.RETRY_DELAY
        
        for attempt in range(max_retries):
            try:
                return func()
            except Exception as e:
                last_exception = e
                if attempt < max_retries - 1:
                    logger.warning(
                        t("console.zepRetryAttempt", operation=operation_name, attempt=attempt + 1, error=str(e)[:100], delay=f"{delay:.1f}")
                    )
                    time.sleep(delay)
                    delay *= 2
                else:
                    logger.error(t("console.zepAllRetriesFailed", operation=operation_name, retries=max_retries, error=str(e)))
        
        raise last_exception
    
    def search_graph(
        self, 
        graph_id: str, 
        query: str, 
        limit: int = 10,
        scope: str = "edges"
    ) -> SearchResult:
        """
        Graph semantic search
        
        Use hybrid search (semantic+BM25) to search for relevant information in the map.
        If Zep Cloud's search API is unavailable, it is downgraded to local keyword matching.
        
        Args:
            graph_id: AtlasID (Standalone Graph)
            query: search query
            limit: Number of results returned
            scope: search scope,"edges" or "nodes"
            
        Returns:
            SearchResult: Search results
        """
        logger.info(t("console.graphSearch", graphId=graph_id, query=query[:50]))

        if self._is_searxng_enabled():
            facts = self._search_with_searxng(query=query, limit=limit)
            return SearchResult(
                facts=facts,
                edges=[],
                nodes=[],
                query=query,
                total_count=len(facts)
            )

        if not self._is_zep_enabled():
            return self._empty_search_result(query)
        
        # Try usingZep Cloud Search API
        try:
            search_results = self._call_with_retry(
                func=lambda: self.client.graph.search(
                    graph_id=graph_id,
                    query=query,
                    limit=limit,
                    scope=scope,
                    reranker="cross_encoder"
                ),
                operation_name=t("console.graphSearchOp", graphId=graph_id)
            )
            
            facts = []
            edges = []
            nodes = []
            
            # Parse edge search results
            if hasattr(search_results, 'edges') and search_results.edges:
                for edge in search_results.edges:
                    if hasattr(edge, 'fact') and edge.fact:
                        facts.append(edge.fact)
                    edges.append({
                        "uuid": getattr(edge, 'uuid_', None) or getattr(edge, 'uuid', ''),
                        "name": getattr(edge, 'name', ''),
                        "fact": getattr(edge, 'fact', ''),
                        "source_node_uuid": getattr(edge, 'source_node_uuid', ''),
                        "target_node_uuid": getattr(edge, 'target_node_uuid', ''),
                    })
            
            # Parse node search results
            if hasattr(search_results, 'nodes') and search_results.nodes:
                for node in search_results.nodes:
                    nodes.append({
                        "uuid": getattr(node, 'uuid_', None) or getattr(node, 'uuid', ''),
                        "name": getattr(node, 'name', ''),
                        "labels": getattr(node, 'labels', []),
                        "summary": getattr(node, 'summary', ''),
                    })
                    # Node summaries also count as facts
                    if hasattr(node, 'summary') and node.summary:
                        facts.append(f"[{node.name}]: {node.summary}")
            
            logger.info(t("console.searchComplete", count=len(facts)))
            
            return SearchResult(
                facts=facts,
                edges=edges,
                nodes=nodes,
                query=query,
                total_count=len(facts)
            )
            
        except Exception as e:
            logger.warning(t("console.zepSearchApiFallback", error=str(e)))
            # Downgrade: Use local keyword match search
            return self._local_search(graph_id, query, limit, scope)
    
    def _local_search(
        self, 
        graph_id: str, 
        query: str, 
        limit: int = 10,
        scope: str = "edges"
    ) -> SearchResult:
        """
        Local keyword matching search (as a downgrade to the Zep Search API)
        
        Get all edges/node, and then perform keyword matching locally
        
        Args:
            graph_id: AtlasID
            query: search query
            limit: Number of results returned
            scope: Search scope
            
        Returns:
            SearchResult: Search results
        """
        logger.info(t("console.usingLocalSearch", query=query[:30]))
        
        facts = []
        edges_result = []
        nodes_result = []
        
        # Extract query keywords (simple word segmentation)
        query_lower = query.lower()
        keywords = [w.strip() for w in query_lower.replace(',', ' ').replace(',', ' ').split() if len(w.strip()) > 1]
        
        def match_score(text: str) -> int:
            """Calculate the match score between text and query"""
            if not text:
                return 0
            text_lower = text.lower()
            # exact match query
            if query_lower in text_lower:
                return 100
            # keyword matching
            score = 0
            for keyword in keywords:
                if keyword in text_lower:
                    score += 10
            return score
        
        try:
            if scope in ["edges", "both"]:
                # Get all edges and match
                all_edges = self.get_all_edges(graph_id)
                scored_edges = []
                for edge in all_edges:
                    score = match_score(edge.fact) + match_score(edge.name)
                    if score > 0:
                        scored_edges.append((score, edge))
                
                # Sort by score
                scored_edges.sort(key=lambda x: x[0], reverse=True)
                
                for score, edge in scored_edges[:limit]:
                    if edge.fact:
                        facts.append(edge.fact)
                    edges_result.append({
                        "uuid": edge.uuid,
                        "name": edge.name,
                        "fact": edge.fact,
                        "source_node_uuid": edge.source_node_uuid,
                        "target_node_uuid": edge.target_node_uuid,
                    })
            
            if scope in ["nodes", "both"]:
                # Get all nodes and match
                all_nodes = self.get_all_nodes(graph_id)
                scored_nodes = []
                for node in all_nodes:
                    score = match_score(node.name) + match_score(node.summary)
                    if score > 0:
                        scored_nodes.append((score, node))
                
                scored_nodes.sort(key=lambda x: x[0], reverse=True)
                
                for score, node in scored_nodes[:limit]:
                    nodes_result.append({
                        "uuid": node.uuid,
                        "name": node.name,
                        "labels": node.labels,
                        "summary": node.summary,
                    })
                    if node.summary:
                        facts.append(f"[{node.name}]: {node.summary}")
            
            logger.info(t("console.localSearchComplete", count=len(facts)))
            
        except Exception as e:
            logger.error(t("console.localSearchFailed", error=str(e)))
        
        return SearchResult(
            facts=facts,
            edges=edges_result,
            nodes=nodes_result,
            query=query,
            total_count=len(facts)
        )
    
    def get_all_nodes(self, graph_id: str) -> List[NodeInfo]:
        """
        Get all nodes of the graph (get in pages)

        Args:
            graph_id: AtlasID

        Returns:
            node list
        """
        if not self._is_zep_enabled():
            return []

        logger.info(t("console.fetchingAllNodes", graphId=graph_id))

        nodes = fetch_all_nodes(self.client, graph_id)

        result = []
        for node in nodes:
            node_uuid = getattr(node, 'uuid_', None) or getattr(node, 'uuid', None) or ""
            result.append(NodeInfo(
                uuid=str(node_uuid) if node_uuid else "",
                name=node.name or "",
                labels=node.labels or [],
                summary=node.summary or "",
                attributes=node.attributes or {}
            ))

        logger.info(t("console.fetchedNodes", count=len(result)))
        return result

    def get_all_edges(self, graph_id: str, include_temporal: bool = True) -> List[EdgeInfo]:
        """
        Obtain all edges of the graph (acquire in pages, including time information)

        Args:
            graph_id: AtlasID
            include_temporal: Whether to include time information (default True)

        Returns:
            edge list (containscreated_at, valid_at, invalid_at, expired_at)
        """
        if not self._is_zep_enabled():
            return []

        logger.info(t("console.fetchingAllEdges", graphId=graph_id))

        edges = fetch_all_edges(self.client, graph_id)

        result = []
        for edge in edges:
            edge_uuid = getattr(edge, 'uuid_', None) or getattr(edge, 'uuid', None) or ""
            edge_info = EdgeInfo(
                uuid=str(edge_uuid) if edge_uuid else "",
                name=edge.name or "",
                fact=edge.fact or "",
                source_node_uuid=edge.source_node_uuid or "",
                target_node_uuid=edge.target_node_uuid or ""
            )

            # Add time information
            if include_temporal:
                edge_info.created_at = getattr(edge, 'created_at', None)
                edge_info.valid_at = getattr(edge, 'valid_at', None)
                edge_info.invalid_at = getattr(edge, 'invalid_at', None)
                edge_info.expired_at = getattr(edge, 'expired_at', None)

            result.append(edge_info)

        logger.info(t("console.fetchedEdges", count=len(result)))
        return result
    
    def get_node_detail(self, node_uuid: str) -> Optional[NodeInfo]:
        """
        Get details of a single node
        
        Args:
            node_uuid: nodeUUID
            
        Returns:
            Node information orNone
        """
        if not self._is_zep_enabled():
            return None

        logger.info(t("console.fetchingNodeDetail", uuid=node_uuid[:8]))
        
        try:
            node = self._call_with_retry(
                func=lambda: self.client.graph.node.get(uuid_=node_uuid),
                operation_name=t("console.fetchNodeDetailOp", uuid=node_uuid[:8])
            )
            
            if not node:
                return None
            
            return NodeInfo(
                uuid=getattr(node, 'uuid_', None) or getattr(node, 'uuid', ''),
                name=node.name or "",
                labels=node.labels or [],
                summary=node.summary or "",
                attributes=node.attributes or {}
            )
        except Exception as e:
            logger.error(t("console.fetchNodeDetailFailed", error=str(e)))
            return None
    
    def get_node_edges(self, graph_id: str, node_uuid: str) -> List[EdgeInfo]:
        """
        Get all edges related to a node
        
        By getting all the edges of the graph and then filtering out the edges related to the specified node
        
        Args:
            graph_id: AtlasID
            node_uuid: nodeUUID
            
        Returns:
            edge list
        """
        logger.info(t("console.fetchingNodeEdges", uuid=node_uuid[:8]))
        
        try:
            # Get all edges of the graph and then filter
            all_edges = self.get_all_edges(graph_id)
            
            result = []
            for edge in all_edges:
                # Checks whether an edge is related to a specified node (as source or target)
                if edge.source_node_uuid == node_uuid or edge.target_node_uuid == node_uuid:
                    result.append(edge)
            
            logger.info(t("console.foundNodeEdges", count=len(result)))
            return result
            
        except Exception as e:
            logger.warning(t("console.fetchNodeEdgesFailed", error=str(e)))
            return []
    
    def get_entities_by_type(
        self, 
        graph_id: str, 
        entity_type: str
    ) -> List[NodeInfo]:
        """
        Get entities by type
        
        Args:
            graph_id: AtlasID
            entity_type: Entity type (e.g. Student, PublicFigure wait)
            
        Returns:
            List of entities matching the type
        """
        logger.info(t("console.fetchingEntitiesByType", type=entity_type))
        
        all_nodes = self.get_all_nodes(graph_id)
        
        filtered = []
        for node in all_nodes:
            # Check whether labels contain the specified type
            if entity_type in node.labels:
                filtered.append(node)
        
        logger.info(t("console.foundEntitiesByType", count=len(filtered), type=entity_type))
        return filtered
    
    def get_entity_summary(
        self, 
        graph_id: str, 
        entity_name: str
    ) -> Dict[str, Any]:
        """
        Get the relationship summary for the specified entity
        
        Search for all information related to this entity and generate a summary
        
        Args:
            graph_id: AtlasID
            entity_name: Entity name
            
        Returns:
            Entity summary information
        """
        logger.info(t("console.fetchingEntitySummary", name=entity_name))
        
        # First search for information related to the entity
        search_result = self.search_graph(
            graph_id=graph_id,
            query=entity_name,
            limit=20
        )
        
        # Try to find the entity in all nodes
        all_nodes = self.get_all_nodes(graph_id)
        entity_node = None
        for node in all_nodes:
            if node.name.lower() == entity_name.lower():
                entity_node = node
                break
        
        related_edges = []
        if entity_node:
            # Pass in the graph_id parameter
            related_edges = self.get_node_edges(graph_id, entity_node.uuid)
        
        return {
            "entity_name": entity_name,
            "entity_info": entity_node.to_dict() if entity_node else None,
            "related_facts": search_result.facts,
            "related_edges": [e.to_dict() for e in related_edges],
            "total_relations": len(related_edges)
        }
    
    def get_graph_statistics(self, graph_id: str) -> Dict[str, Any]:
        """
        Get graph statistics
        
        Args:
            graph_id: AtlasID
            
        Returns:
            Statistics
        """
        logger.info(t("console.fetchingGraphStats", graphId=graph_id))
        
        nodes = self.get_all_nodes(graph_id)
        edges = self.get_all_edges(graph_id)
        
        # Statistical entity type distribution
        entity_types = {}
        for node in nodes:
            for label in node.labels:
                if label not in ["Entity", "Node"]:
                    entity_types[label] = entity_types.get(label, 0) + 1
        
        # Statistical relationship type distribution
        relation_types = {}
        for edge in edges:
            relation_types[edge.name] = relation_types.get(edge.name, 0) + 1
        
        return {
            "graph_id": graph_id,
            "total_nodes": len(nodes),
            "total_edges": len(edges),
            "entity_types": entity_types,
            "relation_types": relation_types
        }
    
    def get_simulation_context(
        self, 
        graph_id: str,
        simulation_requirement: str,
        limit: int = 30
    ) -> Dict[str, Any]:
        """
        Get simulation-related contextual information
        
        Comprehensive search for all information relevant to your simulation needs
        
        Args:
            graph_id: AtlasID
            simulation_requirement: Simulation requirement description
            limit: Quantity limit for each type of information
            
        Returns:
            Simulation context information
        """
        logger.info(t("console.fetchingSimContext", requirement=simulation_requirement[:50]))
        
        # Search for information related to simulation requirements
        search_result = self.search_graph(
            graph_id=graph_id,
            query=simulation_requirement,
            limit=limit
        )
        
        # Get graph statistics
        stats = self.get_graph_statistics(graph_id)
        
        # Get all entity nodes
        all_nodes = self.get_all_nodes(graph_id)
        
        # Filter entities with actual types (non-pure Entity nodes)
        entities = []
        for node in all_nodes:
            custom_labels = [l for l in node.labels if l not in ["Entity", "Node"]]
            if custom_labels:
                entities.append({
                    "name": node.name,
                    "type": custom_labels[0],
                    "summary": node.summary
                })
        
        return {
            "simulation_requirement": simulation_requirement,
            "related_facts": search_result.facts,
            "graph_statistics": stats,
            "entities": entities[:limit],  # limited quantity
            "total_entities": len(entities)
        }
    
    # ========== Core search tools (after optimization) ==========
    
    def insight_forge(
        self,
        graph_id: str,
        query: str,
        simulation_requirement: str,
        report_context: str = "",
        max_sub_queries: int = 5
    ) -> InsightForgeResult:
        """
        [InsightForge - Deep Insight Search]
        
        The most powerful hybrid retrieval function, automatically decomposes the problem and performs multi-dimensional retrieval:
        1. Use LLM to decompose the problem into multiple sub-problems
        2. Conduct semantic search for each sub-question
        3. Extract related entities and get their details
        4. Trace the relationship chain
        5. Integrate all results to generate in-depth insights
        
        Args:
            graph_id: AtlasID
            query: User issues
            simulation_requirement: Simulation requirement description
            report_context: Report context (optional, for more precise sub-question generation)
            max_sub_queries: Maximum number of subproblems
            
        Returns:
            InsightForgeResult: Deep insights into search results
        """
        if self._is_searxng_enabled():
            sub_queries = [query]
            if simulation_requirement and simulation_requirement not in sub_queries:
                sub_queries.append(simulation_requirement)
            sub_queries = sub_queries[:max(1, max_sub_queries)]

            seen_facts = set()
            all_facts: List[str] = []
            per_query_limit = max(1, Config.WEB_SEARCH_LIMIT)
            for sub_query in sub_queries:
                for fact in self._search_with_searxng(sub_query, per_query_limit):
                    if fact not in seen_facts:
                        seen_facts.add(fact)
                        all_facts.append(fact)

            return InsightForgeResult(
                query=query,
                simulation_requirement=simulation_requirement,
                sub_queries=sub_queries,
                semantic_facts=all_facts,
                entity_insights=[],
                relationship_chains=[],
                total_facts=len(all_facts),
                total_entities=0,
                total_relationships=0
            )

        if not self._is_zep_enabled():
            return InsightForgeResult(
                query=query,
                simulation_requirement=simulation_requirement,
                sub_queries=[query]
            )

        logger.info(t("console.insightForgeStart", query=query[:50]))
        
        result = InsightForgeResult(
            query=query,
            simulation_requirement=simulation_requirement,
            sub_queries=[]
        )
        
        # Step 1: Use LLM to generate subproblems
        sub_queries = self._generate_sub_queries(
            query=query,
            simulation_requirement=simulation_requirement,
            report_context=report_context,
            max_queries=max_sub_queries
        )
        result.sub_queries = sub_queries
        logger.info(t("console.generatedSubQueries", count=len(sub_queries)))
        
        # Step 2: Semantic search for each sub-question
        all_facts = []
        all_edges = []
        seen_facts = set()
        
        for sub_query in sub_queries:
            search_result = self.search_graph(
                graph_id=graph_id,
                query=sub_query,
                limit=15,
                scope="edges"
            )
            
            for fact in search_result.facts:
                if fact not in seen_facts:
                    all_facts.append(fact)
                    seen_facts.add(fact)
            
            all_edges.extend(search_result.edges)
        
        # Also search for the original question
        main_search = self.search_graph(
            graph_id=graph_id,
            query=query,
            limit=20,
            scope="edges"
        )
        for fact in main_search.facts:
            if fact not in seen_facts:
                all_facts.append(fact)
                seen_facts.add(fact)
        
        result.semantic_facts = all_facts
        result.total_facts = len(all_facts)
        
        # Step 3: Extract related entity UUIDs from edges and only obtain information about these entities (not all nodes)
        entity_uuids = set()
        for edge_data in all_edges:
            if isinstance(edge_data, dict):
                source_uuid = edge_data.get('source_node_uuid', '')
                target_uuid = edge_data.get('target_node_uuid', '')
                if source_uuid:
                    entity_uuids.add(source_uuid)
                if target_uuid:
                    entity_uuids.add(target_uuid)
        
        # Get details of all related entities (unlimited number, complete output)
        entity_insights = []
        node_map = {}  # Used for subsequent relationship chain building
        
        for uuid in list(entity_uuids):  # Process all entities without truncation
            if not uuid:
                continue
            try:
                # Get information about each relevant node individually
                node = self.get_node_detail(uuid)
                if node:
                    node_map[uuid] = node
                    entity_type = next((l for l in node.labels if l not in ["Entity", "Node"]), "entity")
                    
                    # Get all facts related to this entity (without truncation)
                    related_facts = [
                        f for f in all_facts 
                        if node.name.lower() in f.lower()
                    ]
                    
                    entity_insights.append({
                        "uuid": node.uuid,
                        "name": node.name,
                        "type": entity_type,
                        "summary": node.summary,
                        "related_facts": related_facts  # Complete output without truncation
                    })
            except Exception as e:
                logger.debug(f"Failed to fetch node {uuid}: {e}")
                continue
        
        result.entity_insights = entity_insights
        result.total_entities = len(entity_insights)
        
        # Step 4: Build all relationship chains (no limit on the number)
        relationship_chains = []
        for edge_data in all_edges:  # Process all edges without truncation
            if isinstance(edge_data, dict):
                source_uuid = edge_data.get('source_node_uuid', '')
                target_uuid = edge_data.get('target_node_uuid', '')
                relation_name = edge_data.get('name', '')
                
                source_name = node_map.get(source_uuid, NodeInfo('', '', [], '', {})).name or source_uuid[:8]
                target_name = node_map.get(target_uuid, NodeInfo('', '', [], '', {})).name or target_uuid[:8]
                
                chain = f"{source_name} --[{relation_name}]--> {target_name}"
                if chain not in relationship_chains:
                    relationship_chains.append(chain)
        
        result.relationship_chains = relationship_chains
        result.total_relationships = len(relationship_chains)
        
        logger.info(t("console.insightForgeComplete", facts=result.total_facts, entities=result.total_entities, relationships=result.total_relationships))
        return result
    
    def _generate_sub_queries(
        self,
        query: str,
        simulation_requirement: str,
        report_context: str = "",
        max_queries: int = 5
    ) -> List[str]:
        """
        Use LLM to generate subproblems
        
        Decompose complex problems into multiple sub-problems that can be retrieved independently
        """
        system_prompt = """You are a professional problem analyzer. Your task is to decompose a complex problem into multiple sub-problems that can be independently observed in a simulated world.

Requirements:
1. Each sub-problem should be specific enough that relevant Agent behaviors or events can be found in the simulated world
2. Sub-questions should cover different dimensions of the original question (such as: who, what, why, how, when, where)
3. Sub-problems should be relevant to the simulation scenario
4. Return JSON format:{"sub_queries": ["subproblem1", "subproblem2", ...]}"""

        user_prompt = f"""Simulation requirements background:
{simulation_requirement}

{f"Report context:{report_context[:500]}" if report_context else ""}

Please break down the following questions into{max_queries}Sub-question:
{query}

Returns a list of subquestions in JSON format."""

        try:
            response = self.llm.chat_json(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3
            )
            
            sub_queries = response.get("sub_queries", [])
            # Make sure it is a list of strings
            return [str(sq) for sq in sub_queries[:max_queries]]
            
        except Exception as e:
            logger.warning(t("console.generateSubQueriesFailed", error=str(e)))
            # Downgrade: Return a variant based on the original question
            return [
                query,
                f"{query} major players in",
                f"{query} causes and effects",
                f"{query} development process"
            ][:max_queries]
    
    def panorama_search(
        self,
        graph_id: str,
        query: str,
        include_expired: bool = True,
        limit: int = 50
    ) -> PanoramaResult:
        """
        PanoramaSearch - Breadth Search
        
        Get the full picture, including all relevant content and history/Expiration information:
        1. Get all relevant nodes
        2. Get all edges (including expired/invalid)
        3. Classify and organize currently valid and historical information
        
        This tool is suitable for scenarios where you need to understand the full picture of an event and track its evolution.
        
        Args:
            graph_id: AtlasID
            query: Search query (for relevance ranking)
            include_expired: Whether to include expired content (default True)
            limit: Limit on the number of results returned
            
        Returns:
            PanoramaResult: Breadth search results
        """
        if self._is_searxng_enabled():
            facts = self._search_with_searxng(query=query, limit=limit)
            return self._panorama_from_facts(query=query, facts=facts)

        if not self._is_zep_enabled():
            return PanoramaResult(query=query)

        logger.info(t("console.panoramaSearchStart", query=query[:50]))
        
        result = PanoramaResult(query=query)
        
        # Get all nodes
        all_nodes = self.get_all_nodes(graph_id)
        node_map = {n.uuid: n for n in all_nodes}
        result.all_nodes = all_nodes
        result.total_nodes = len(all_nodes)
        
        # Get all edges (including time information)
        all_edges = self.get_all_edges(graph_id, include_temporal=True)
        result.all_edges = all_edges
        result.total_edges = len(all_edges)
        
        # classification facts
        active_facts = []
        historical_facts = []
        
        for edge in all_edges:
            if not edge.fact:
                continue
            
            # Add entity name to fact
            source_name = node_map.get(edge.source_node_uuid, NodeInfo('', '', [], '', {})).name or edge.source_node_uuid[:8]
            target_name = node_map.get(edge.target_node_uuid, NodeInfo('', '', [], '', {})).name or edge.target_node_uuid[:8]
            
            # Determine whether it has expired/Invalid
            is_historical = edge.is_expired or edge.is_invalid
            
            if is_historical:
                # history/Expired facts, add timestamp
                valid_at = edge.valid_at or "unknown"
                invalid_at = edge.invalid_at or edge.expired_at or "unknown"
                fact_with_time = f"[{valid_at} - {invalid_at}] {edge.fact}"
                historical_facts.append(fact_with_time)
            else:
                # current valid facts
                active_facts.append(edge.fact)
        
        # Relevance ranking based on query
        query_lower = query.lower()
        keywords = [w.strip() for w in query_lower.replace(',', ' ').replace(',', ' ').split() if len(w.strip()) > 1]
        
        def relevance_score(fact: str) -> int:
            fact_lower = fact.lower()
            score = 0
            if query_lower in fact_lower:
                score += 100
            for kw in keywords:
                if kw in fact_lower:
                    score += 10
            return score
        
        # Sort and limit quantities
        active_facts.sort(key=relevance_score, reverse=True)
        historical_facts.sort(key=relevance_score, reverse=True)
        
        result.active_facts = active_facts[:limit]
        result.historical_facts = historical_facts[:limit] if include_expired else []
        result.active_count = len(active_facts)
        result.historical_count = len(historical_facts)
        
        logger.info(t("console.panoramaSearchComplete", active=result.active_count, historical=result.historical_count))
        return result
    
    def quick_search(
        self,
        graph_id: str,
        query: str,
        limit: int = 10
    ) -> SearchResult:
        """
        QuickSearch - Simple search
        
        Fast, lightweight search tool:
        1. Directly call Zep semantic search
        2. Return the most relevant results
        3. Suitable for simple and direct retrieval needs
        
        Args:
            graph_id: AtlasID
            query: search query
            limit: Number of results returned
            
        Returns:
            SearchResult: Search results
        """
        if self._is_searxng_enabled():
            facts = self._search_with_searxng(query=query, limit=limit)
            return SearchResult(
                facts=facts,
                edges=[],
                nodes=[],
                query=query,
                total_count=len(facts)
            )

        if not self._is_zep_enabled():
            return self._empty_search_result(query)

        logger.info(t("console.quickSearchStart", query=query[:50]))
        
        # Directly call the existing search_graph method
        result = self.search_graph(
            graph_id=graph_id,
            query=query,
            limit=limit,
            scope="edges"
        )
        
        logger.info(t("console.quickSearchComplete", count=result.total_count))
        return result
    
    def interview_agents(
        self,
        simulation_id: str,
        interview_requirement: str,
        simulation_requirement: str = "",
        max_agents: int = 5,
        custom_questions: List[str] = None
    ) -> InterviewResult:
        """
        InterviewAgents - In-depth interview
        
        Call the real OASIS interview API and interview the agent running in the simulation:
        1. Automatically read character files and understand all simulated Agents
        2. Use LLM to analyze interview needs and intelligently select the most relevant Agent
        3. Use LLM to generate interview questions
        4. Call /api/simulation/interview/batch Interface for real interviews (simultaneous interviews on dual platforms)
        5. Integrate all interview results and generate interview reports
        
        [Important] This function requires the simulation environment to be running (the OASIS environment is not closed)
        
        Use cases:
        - Need to understand events from different character perspectives
        - Need to collect opinions and perspectives from multiple parties
        - Need to obtain real answers from the simulated Agent (non-LLM simulation)
        
        Args:
            simulation_id: Impersonation ID (used to locate the persona file and call the interview API)
            interview_requirement: Description of interview needs (unstructured, e.g."Understand students’ views on the incident")
            simulation_requirement: Simulation requirements background (optional)
            max_agents: Maximum number of agents interviewed
            custom_questions: Custom interview questions (optional, automatically generated if not provided)
            
        Returns:
            InterviewResult: Interview results
        """
        from .simulation_runner import SimulationRunner
        
        logger.info(t("console.interviewAgentsStart", requirement=interview_requirement[:50]))
        
        result = InterviewResult(
            interview_topic=interview_requirement,
            interview_questions=custom_questions or []
        )
        
        # Step 1: Read character file
        profiles = self._load_agent_profiles(simulation_id)
        
        if not profiles:
            logger.warning(t("console.profilesNotFound", simId=simulation_id))
            result.summary = "No interviewable agent profile files were found."
            return result
        
        result.total_agents = len(profiles)
        logger.info(t("console.loadedProfiles", count=len(profiles)))
        
        # Step 2: Use LLM to select the Agent to interview (returns a list of agent_ids)
        selected_agents, selected_indices, selection_reasoning = self._select_agents_for_interview(
            profiles=profiles,
            interview_requirement=interview_requirement,
            simulation_requirement=simulation_requirement,
            max_agents=max_agents
        )
        
        result.selected_agents = selected_agents
        result.selection_reasoning = selection_reasoning
        logger.info(t("console.selectedAgentsForInterview", count=len(selected_agents), indices=selected_indices))
        
        # Step 3: Generate interview questions (if not provided)
        if not result.interview_questions:
            result.interview_questions = self._generate_interview_questions(
                interview_requirement=interview_requirement,
                simulation_requirement=simulation_requirement,
                selected_agents=selected_agents
            )
            logger.info(t("console.generatedInterviewQuestions", count=len(result.interview_questions)))
        
        # Combine questions into one interviewprompt
        combined_prompt = "\n".join([f"{i+1}. {q}" for i, q in enumerate(result.interview_questions)])
        
        # Add optimization prefix to constrain Agent reply format
        INTERVIEW_PROMPT_PREFIX = (
            'You are having an interview. Please combine your character, all past memories and actions, '
            'and answer the following questions directly in plain text.\n'
            'Reply requirements:\n'
            '1. Answer directly in natural language without calling any tools\n'
            '2. Do not return JSON format or tool call format\n'
            "3. Don't use Markdown headers (like #, ##, ###)\n"
            '4. Answer one by one according to the question number. Each answer starts with "Question X:" (X is the question number)\n'
            '5. Separate the answers to each question with a blank line\n'
            '6. Answers should be substantive, with at least 2-3 sentences for each question\n\n'
        )
        optimized_prompt = f"{INTERVIEW_PROMPT_PREFIX}{combined_prompt}"
        
        # Step 4: Call the real interview API (without specifying the platform, the default is to interview simultaneously on both platforms)
        try:
            # Build a batch interview list (no platform specified, dual-platform interviews)
            interviews_request = []
            for agent_idx in selected_indices:
                interviews_request.append({
                    "agent_id": agent_idx,
                    "prompt": optimized_prompt  # Use optimizedprompt
                    # If the platform is not specified, the API will access both twitter and reddit platforms.
                })
            
            logger.info(t("console.callingBatchInterviewApi", count=len(interviews_request)))
            
            # Call the batch interview method of SimulationRunner (no platform is passed, dual-platform interview)
            api_result = SimulationRunner.interview_agents_batch(
                simulation_id=simulation_id,
                interviews=interviews_request,
                platform=None,  # No platform specified, dual-platform interview
                timeout=180.0   # Dual platforms require longer timeouts
            )
            
            logger.info(t("console.interviewApiReturned", count=api_result.get('interviews_count', 0), success=api_result.get('success')))
            
            # Check if API call is successful
            if not api_result.get("success", False):
                error_msg = api_result.get("error", "Unknown error")
                logger.warning(t("console.interviewApiReturnedFailure", error=error_msg))
                result.summary = f"Interview API call failed: {error_msg}. Please verify OASIS simulation environment status."
                return result
            
            # Step 5: Parse the API return results and construct the AgentInterview object
            # Dual platform mode return format: {"twitter_0": {...}, "reddit_0": {...}, "twitter_1": {...}, ...}
            api_data = api_result.get("result", {})
            results_dict = api_data.get("results", {}) if isinstance(api_data, dict) else {}
            
            for i, agent_idx in enumerate(selected_indices):
                agent = selected_agents[i]
                agent_name = agent.get("realname", agent.get("username", f"Agent_{agent_idx}"))
                agent_role = agent.get("profession", "unknown")
                agent_bio = agent.get("bio", "")
                
                # Get the interview results of the Agent on two platforms
                twitter_result = results_dict.get(f"twitter_{agent_idx}", {})
                reddit_result = results_dict.get(f"reddit_{agent_idx}", {})
                
                twitter_response = twitter_result.get("response", "")
                reddit_response = reddit_result.get("response", "")

                # Clean up possible tool calls JSON wrapper
                twitter_response = self._clean_tool_call_response(twitter_response)
                reddit_response = self._clean_tool_call_response(reddit_response)

                # Always output dual platform tags
                twitter_text = twitter_response if twitter_response else "(The platform did not receive a reply)"
                reddit_text = reddit_response if reddit_response else "(The platform did not receive a reply)"
                response_text = f"[Twitter platform answer]\n{twitter_text}\n\n[Reddit platform answer]\n{reddit_text}"

                # Extract key quotes (from answers on both platforms)
                import re
                combined_responses = f"{twitter_response} {reddit_response}"

                # Clean response text: remove tags, numbers, Markdown and other interference
                clean_text = re.sub(r'#{1,6}\s+', '', combined_responses)
                clean_text = re.sub(r'\{[^}]*tool_name[^}]*\}', '', clean_text)
                clean_text = re.sub(r'[*_`|>~\-]{2,}', '', clean_text)
                clean_text = re.sub(r'question\d+[::]\s*', '', clean_text)
                clean_text = clean_text.replace('[Twitter platform answer]', '').replace('[Reddit platform answer]', '')

                # Strategy 1 (Main): Extract complete sentences with substantial content
                sentences = re.split(r'[. ! ?]', clean_text)
                meaningful = [
                    s.strip() for s in sentences
                    if 20 <= len(s.strip()) <= 150
                    and not re.match(r'^[\s\W,,;;::,]+', s.strip())
                    and not s.strip().startswith(('{', 'question'))
                ]
                meaningful.sort(key=len, reverse=True)
                key_quotes = [s + "." for s in meaningful[:3]]

                # Strategy 2 (Supplementary): Text paired within quotation marks
                if not key_quotes:
                    paired = re.findall(r'\u201c([^\u201c\u201d]{15,100})\u201d', clean_text)
                    paired += re.findall(r'\u300c([^\u300c\u300d]{15,100})\u300d', clean_text)
                    key_quotes = [q for q in paired if not re.match(r'^[,,;;::,]', q)][:3]
                
                interview = AgentInterview(
                    agent_name=agent_name,
                    agent_role=agent_role,
                    agent_bio=agent_bio[:1000],  # Expand bio length limit
                    question=combined_prompt,
                    response=response_text,
                    key_quotes=key_quotes[:5]
                )
                result.interviews.append(interview)
            
            result.interviewed_count = len(result.interviews)
            
        except ValueError as e:
            # The simulation environment is not running
            logger.warning(t("console.interviewApiCallFailed", error=e))
            result.summary = f"Interview failed: {str(e)}. The simulation environment may be closed; ensure OASIS is running."
            return result
        except Exception as e:
            logger.error(t("console.interviewApiCallException", error=e))
            import traceback
            logger.error(traceback.format_exc())
            result.summary = f"Interview process failed with error: {str(e)}"
            return result
        
        # Step 6: Generate interview summary
        if result.interviews:
            result.summary = self._generate_interview_summary(
                interviews=result.interviews,
                interview_requirement=interview_requirement
            )
        
        logger.info(t("console.interviewAgentsComplete", count=result.interviewed_count))
        return result
    
    @staticmethod
    def _clean_tool_call_response(response: str) -> str:
        """Clean the JSON tool call package in Agent responses and extract the actual content"""
        if not response or not response.strip().startswith('{'):
            return response
        text = response.strip()
        if 'tool_name' not in text[:80]:
            return response
        import re as _re
        try:
            data = json.loads(text)
            if isinstance(data, dict) and 'arguments' in data:
                for key in ('content', 'text', 'body', 'message', 'reply'):
                    if key in data['arguments']:
                        return str(data['arguments'][key])
        except (json.JSONDecodeError, KeyError, TypeError):
            match = _re.search(r'"content"\s*:\s*"((?:[^"\\]|\\.)*)"', text)
            if match:
                return match.group(1).replace('\\n', '\n').replace('\\"', '"')
        return response

    def _load_agent_profiles(self, simulation_id: str) -> List[Dict[str, Any]]:
        """Load the simulated Agent profile file"""
        import os
        import csv
        
        # Build character file path
        sim_dir = os.path.join(
            os.path.dirname(__file__), 
            f'../../uploads/simulations/{simulation_id}'
        )
        
        profiles = []
        
        # Prioritize trying to read Reddit JSON format
        reddit_profile_path = os.path.join(sim_dir, "reddit_profiles.json")
        if os.path.exists(reddit_profile_path):
            try:
                with open(reddit_profile_path, 'r', encoding='utf-8') as f:
                    profiles = json.load(f)
                logger.info(t("console.loadedRedditProfiles", count=len(profiles)))
                return profiles
            except Exception as e:
                logger.warning(t("console.readRedditProfilesFailed", error=e))
        
        # Trying to read Twitter CSV format
        twitter_profile_path = os.path.join(sim_dir, "twitter_profiles.csv")
        if os.path.exists(twitter_profile_path):
            try:
                with open(twitter_profile_path, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        # CSVConvert the format to a unified format
                        profiles.append({
                            "realname": row.get("name", ""),
                            "username": row.get("username", ""),
                            "bio": row.get("description", ""),
                            "persona": row.get("user_char", ""),
                            "profession": "unknown"
                        })
                logger.info(t("console.loadedTwitterProfiles", count=len(profiles)))
                return profiles
            except Exception as e:
                logger.warning(t("console.readTwitterProfilesFailed", error=e))
        
        return profiles
    
    def _select_agents_for_interview(
        self,
        profiles: List[Dict[str, Any]],
        interview_requirement: str,
        simulation_requirement: str,
        max_agents: int
    ) -> tuple:
        """
        Use LLM to select people to interviewAgent
        
        Returns:
            tuple: (selected_agents, selected_indices, reasoning)
                - selected_agents: Complete information list of selected Agent
                - selected_indices: Select the index list of the Agent (used for API calls)
                - reasoning: Reason for selection
        """
        
        # Build Agent summary list
        agent_summaries = []
        for i, profile in enumerate(profiles):
            summary = {
                "index": i,
                "name": profile.get("realname", profile.get("username", f"Agent_{i}")),
                "profession": profile.get("profession", "unknown"),
                "bio": profile.get("bio", "")[:200],
                "interested_topics": profile.get("interested_topics", [])
            }
            agent_summaries.append(summary)
        
        system_prompt = """You are a professional interview planner. Your task is to select the most suitable interviewee from the simulated Agent list based on the interview needs.

Selection criteria:
1. Agent’s identity/Careers related to interview topics
2. Agent may hold unique or valuable viewpoints
3. Choose diverse perspectives (such as supporters, opponents, neutral parties, professionals, etc.)
4. Prioritize roles directly related to the incident

Return JSON format:
{
    "selected_indices": [Select the index list of Agent],
    "reasoning": "Reason for selection"
}"""

        user_prompt = f"""Interview requirements:
{interview_requirement}

Simulation background:
{simulation_requirement if simulation_requirement else "Not provided"}

Selectable Agent list (total{len(agent_summaries)}indivual):
{json.dumps(agent_summaries, ensure_ascii=False, indent=2)}

Please select the most{max_agents}Which Agent is most suitable for interviewing and explain the reasons for selection."""

        try:
            response = self.llm.chat_json(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3
            )
            
            selected_indices = response.get("selected_indices", [])[:max_agents]
            reasoning = response.get("reasoning", "Automatic selection based on relevance")
            
            # Get complete information of the selected Agent
            selected_agents = []
            valid_indices = []
            for idx in selected_indices:
                if 0 <= idx < len(profiles):
                    selected_agents.append(profiles[idx])
                    valid_indices.append(idx)
            
            return selected_agents, valid_indices, reasoning
            
        except Exception as e:
            logger.warning(t("console.llmSelectAgentFailed", error=e))
            # Downgrade: Select top N
            selected = profiles[:max_agents]
            indices = list(range(min(max_agents, len(profiles))))
            return selected, indices, "Use default selection strategy"
    
    def _generate_interview_questions(
        self,
        interview_requirement: str,
        simulation_requirement: str,
        selected_agents: List[Dict[str, Any]]
    ) -> List[str]:
        """Generate interview questions using LLM"""
        
        agent_roles = [a.get("profession", "unknown") for a in selected_agents]
        
        system_prompt = """You are a professional journalist/interviewer. Based on interview needs, generate 3-5 in-depth interview questions.

Question requirements:
1. Open questions, detailed answers are encouraged
2. There may be different answers for different roles.
3. Cover multiple dimensions such as facts, opinions, and feelings
4. The language is natural, like a real interview
5. Each question should be limited to 50 words, concise and clear.
6. Ask questions directly without including background information or prefixes

Return JSON format:{"questions": ["question1", "question2", ...]}"""

        user_prompt = f"""Interview requirements:{interview_requirement}

Simulation background:{simulation_requirement if simulation_requirement else "Not provided"}

Interviewee role:{', '.join(agent_roles)}

Please generate 3-5 interview questions."""

        try:
            response = self.llm.chat_json(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.5
            )
            
            return response.get("questions", [f"about{interview_requirement}, what do you think?"])
            
        except Exception as e:
            logger.warning(t("console.generateInterviewQuestionsFailed", error=e))
            return [
                f"about{interview_requirement}, what is your point of view?",
                "How does this impact you or the group you represent?",
                "How do you think this problem should be solved or improved?"
            ]
    
    def _generate_interview_summary(
        self,
        interviews: List[AgentInterview],
        interview_requirement: str
    ) -> str:
        """Generate interview summary"""
        
        if not interviews:
            return "No interviews completed"
        
        # Collect all interviews
        interview_texts = []
        for interview in interviews:
            interview_texts.append(f"[{interview.agent_name} ({interview.agent_role})]\n{interview.response[:500]}")
        
        quote_instruction = 'Use quotation marks "..." when quoting interviewees'
        system_prompt = f"""You are a professional news editor. Please generate an interview summary based on responses from multiple interviewees.

Abstract requirements:
1. Extract the main points of view of all parties
2. Point out the consensus and differences of views
3. Highlight valuable quotes
4. Be objective and neutral, not taking sides
5. Control within 1,000 words

Format constraints (must be adhered to):
- Use plain text paragraphs with blank lines separating different sections
- Don't use Markdown headers (like#,##,###)
- Do not use dividing lines (such as ---,***)
- {quote_instruction}
- Can be used**Bold**Mark keywords, but don’t use other Markdown syntax"""

        user_prompt = f"""Interview topic:{interview_requirement}

Interview content:
{"".join(interview_texts)}

Please generate an interview summary."""

        try:
            summary = self.llm.chat(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                max_tokens=800
            )
            return summary
            
        except Exception as e:
            logger.warning(t("console.generateInterviewSummaryFailed", error=e))
            # Downgrade: Simple splicing
            return f"Interviewed in total{len(interviews)}interviewees, including:" + ",".join([i.agent_name for i in interviews])

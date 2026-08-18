import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquareQuote, Sparkles, X, Music, RefreshCw, ZoomIn, ZoomOut, Info, Maximize2, Minimize2, UserCheck } from 'lucide-react';
import { NETWORK_NODES, NETWORK_LINKS, NetworkNode, NetworkLink } from '../../data/characterNetworkData';
import { ambientSynth } from '../../utils/audioSynth';

interface CharacterNetworkProps {
  onClose?: () => void;
}

export const CharacterNetwork: React.FC<CharacterNetworkProps> = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [selectedLink, setSelectedLink] = useState<NetworkLink | null>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Zoom transform state
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const gRef = useRef<SVGGElement | null>(null);

  const filterOptions = [
    { id: 'all', label: '全部關聯 (All)' },
    { id: 'rivalry', label: '宿命對立 (Rivalry)' },
    { id: 'love', label: '真愛羈絆 (Love)' },
    { id: 'family', label: '血緣親情 (Family)' },
    { id: 'comrades', label: '革命同志 (Comrades)' },
    { id: 'promise', label: '神聖承諾 (Promise)' },
  ];

  const getLinkColor = (type: string) => {
    switch (type) {
      case 'rivalry': return '#ef4444'; // Red
      case 'love': return '#ec4899'; // Pink
      case 'family': return '#f59e0b'; // Amber
      case 'comrades': return '#3b82f6'; // Blue
      case 'promise': return '#a855f7'; // Purple
      default: return '#78716c';
    }
  };

  const handleSelectNode = (node: NetworkNode) => {
    setSelectedNode(node);
    // Find links associated with this node
    const relatedLinks = NETWORK_LINKS.filter(
      (l) => l.source === node.id || l.target === node.id ||
             (typeof l.source === 'object' && (l.source as any).id === node.id) ||
             (typeof l.target === 'object' && (l.target as any).id === node.id)
    );
    if (relatedLinks.length > 0) {
      setSelectedLink(relatedLinks[0]);
    }
  };

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 900;
    const height = isFullscreen ? window.innerHeight - 180 : 550;

    // Filter links based on filterType
    const filteredLinksData = filterType === 'all'
      ? NETWORK_LINKS
      : NETWORK_LINKS.filter(l => l.type === filterType);

    // Deep clone data for D3 mutation
    const nodesData: (NetworkNode & d3.SimulationNodeDatum)[] = NETWORK_NODES.map(d => ({ ...d }));
    const linksData: (NetworkLink & d3.SimulationLinkDatum<NetworkNode & d3.SimulationNodeDatum>)[] = filteredLinksData.map(d => ({ ...d }));

    // Clear previous SVG contents
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    // Create defs for image patterns and glow filters
    const defs = svg.append('defs');

    // Glow filter
    const filter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');

    filter.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'coloredBlur');

    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Create pattern for each character node avatar
    nodesData.forEach((node) => {
      const pattern = defs.append('pattern')
        .attr('id', `avatar-${node.id}`)
        .attr('width', 1)
        .attr('height', 1)
        .attr('patternContentUnits', 'objectBoundingBox');

      pattern.append('image')
        .attr('href', node.image)
        .attr('width', 1)
        .attr('height', 1)
        .attr('preserveAspectRatio', 'xMidYMid slice');
    });

    // Container Group for zoom/pan
    const g = svg.append('g').attr('class', 'main-g');
    gRef.current = g.node();

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 2.5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    zoomBehaviorRef.current = zoom;
    svg.call(zoom);

    // D3 Force Simulation
    const simulation = d3.forceSimulation<NetworkNode & d3.SimulationNodeDatum>(nodesData)
      .alphaDecay(0.04)
      .force('link', d3.forceLink<NetworkNode & d3.SimulationNodeDatum, NetworkLink & d3.SimulationLinkDatum<NetworkNode & d3.SimulationNodeDatum>>(linksData)
        .id(d => d.id)
        .distance(160)
      )
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius(55));

    // Render Links Group
    const linkGroup = g.append('g').attr('class', 'links');

    // 1. Hit Area Lines (Thick invisible stroke to easily capture clicks)
    const hitLines = linkGroup.selectAll<SVGLineElement, NetworkLink & d3.SimulationLinkDatum<NetworkNode & d3.SimulationNodeDatum>>('line.hit-area')
      .data(linksData)
      .enter()
      .append('line')
      .attr('class', 'hit-area')
      .attr('stroke', 'transparent')
      .attr('stroke-width', 22)
      .attr('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        ambientSynth.playCardClickSFX();
        setSelectedLink(d);
        setSelectedNode(null);
      });

    // 2. Visible Styled Lines
    const linkLines = linkGroup.selectAll<SVGLineElement, NetworkLink & d3.SimulationLinkDatum<NetworkNode & d3.SimulationNodeDatum>>('line.visible-line')
      .data(linksData)
      .enter()
      .append('line')
      .attr('class', 'visible-line')
      .attr('stroke', d => getLinkColor(d.type))
      .attr('stroke-opacity', d => (selectedLink && selectedLink.id === d.id) ? 1 : 0.6)
      .attr('stroke-width', d => (selectedLink && selectedLink.id === d.id) ? 4 : 2.5)
      .attr('stroke-dasharray', d => d.type === 'rivalry' ? '6,3' : 'none')
      .attr('pointer-events', 'none');

    // Render Link Badge Labels Group
    const linkLabelsGroup = g.append('g').attr('class', 'link-labels');

    const linkLabelNodes = linkLabelsGroup.selectAll<SVGGElement, NetworkLink & d3.SimulationLinkDatum<NetworkNode & d3.SimulationNodeDatum>>('g.link-badge')
      .data(linksData)
      .enter()
      .append('g')
      .attr('class', 'link-badge')
      .attr('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        ambientSynth.playCardClickSFX();
        setSelectedLink(d);
        setSelectedNode(null);
      });

    // Badge Background Rect
    linkLabelNodes.append('rect')
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', '#121214')
      .attr('stroke', d => getLinkColor(d.type))
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.92);

    // Badge Text
    const linkTexts = linkLabelNodes.append('text')
      .text(d => d.relationZh)
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('fill', d => getLinkColor(d.type))
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('class', 'font-serif-tc select-none');

    // Dynamically adjust rect dimensions around text
    linkLabelNodes.each(function() {
      const g = d3.select(this);
      const textNode = g.select<SVGTextElement>('text').node();
      if (textNode) {
        const bbox = textNode.getBBox();
        g.select('rect')
          .attr('x', bbox.x - 6)
          .attr('y', bbox.y - 3)
          .attr('width', bbox.width + 12)
          .attr('height', bbox.height + 6);
      }
    });

    // Render Nodes Group
    const nodeGroup = g.append('g').attr('class', 'nodes');

    let dragStartX = 0;
    let dragStartY = 0;

    const nodes = nodeGroup.selectAll<SVGGElement, NetworkNode & d3.SimulationNodeDatum>('g')
      .data(nodesData)
      .enter()
      .append('g')
      .attr('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, NetworkNode & d3.SimulationNodeDatum>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
            dragStartX = event.x;
            dragStartY = event.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;

            // Distance check to reliably detect click vs drag
            const dist = Math.hypot(event.x - dragStartX, event.y - dragStartY);
            if (dist < 6) {
              ambientSynth.playCardClickSFX();
              handleSelectNode(d);
            }
          })
      );

    // Outer Halo Circle
    nodes.append('circle')
      .attr('class', 'halo-circle')
      .attr('r', d => (selectedNode && selectedNode.id === d.id) ? 32 : 28)
      .attr('fill', '#121214')
      .attr('stroke', d => (selectedNode && selectedNode.id === d.id) ? '#f59e0b' : d.color)
      .attr('stroke-width', d => (selectedNode && selectedNode.id === d.id) ? 4 : 2.5)
      .attr('filter', 'url(#glow)');

    // Inner Avatar Circle
    nodes.append('circle')
      .attr('class', 'avatar-circle')
      .attr('r', d => (selectedNode && selectedNode.id === d.id) ? 28 : 24)
      .attr('fill', d => `url(#avatar-${d.id})`);

    // Character Chinese Name
    nodes.append('text')
      .text(d => d.name)
      .attr('dy', 44)
      .attr('text-anchor', 'middle')
      .attr('fill', '#f5f5f4')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .style('text-shadow', '0 2px 4px rgba(0,0,0,0.9), 0 0 4px #000')
      .attr('class', 'font-serif-tc select-none');

    // Role Name Label
    nodes.append('text')
      .text(d => d.roleName)
      .attr('dy', 57)
      .attr('text-anchor', 'middle')
      .attr('fill', '#a8a29e')
      .attr('font-size', '9px')
      .style('text-shadow', '0 2px 4px rgba(0,0,0,0.9)')
      .attr('class', 'font-sans select-none');

    // Simulation Ticks
    simulation.on('tick', () => {
      hitLines
        .attr('x1', d => (d.source as NetworkNode & d3.SimulationNodeDatum).x || 0)
        .attr('y1', d => (d.source as NetworkNode & d3.SimulationNodeDatum).y || 0)
        .attr('x2', d => (d.target as NetworkNode & d3.SimulationNodeDatum).x || 0)
        .attr('y2', d => (d.target as NetworkNode & d3.SimulationNodeDatum).y || 0);

      linkLines
        .attr('x1', d => (d.source as NetworkNode & d3.SimulationNodeDatum).x || 0)
        .attr('y1', d => (d.source as NetworkNode & d3.SimulationNodeDatum).y || 0)
        .attr('x2', d => (d.target as NetworkNode & d3.SimulationNodeDatum).x || 0)
        .attr('y2', d => (d.target as NetworkNode & d3.SimulationNodeDatum).y || 0);

      linkLabelNodes.attr('transform', d => {
        const sx = (d.source as NetworkNode & d3.SimulationNodeDatum).x || 0;
        const tx = (d.target as NetworkNode & d3.SimulationNodeDatum).x || 0;
        const sy = (d.source as NetworkNode & d3.SimulationNodeDatum).y || 0;
        const ty = (d.target as NetworkNode & d3.SimulationNodeDatum).y || 0;
        return `translate(${(sx + tx) / 2}, ${(sy + ty) / 2})`;
      });

      nodes.attr('transform', d => `translate(${d.x || 0}, ${d.y || 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [filterType, isFullscreen]);

  // High-performance selection highlight update without recreating force simulation
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    // Update link highlight
    svg.selectAll<SVGLineElement, any>('line.visible-line')
      .attr('stroke-opacity', d => (selectedLink && selectedLink.id === d.id) ? 1 : 0.6)
      .attr('stroke-width', d => (selectedLink && selectedLink.id === d.id) ? 4 : 2.5);

    // Update halo circle highlight
    svg.selectAll<SVGCircleElement, any>('circle.halo-circle')
      .attr('r', d => (selectedNode && selectedNode.id === d.id) ? 32 : 28)
      .attr('stroke', d => (selectedNode && selectedNode.id === d.id) ? '#f59e0b' : d.color)
      .attr('stroke-width', d => (selectedNode && selectedNode.id === d.id) ? 4 : 2.5);

    // Update avatar circle radius
    svg.selectAll<SVGCircleElement, any>('circle.avatar-circle')
      .attr('r', d => (selectedNode && selectedNode.id === d.id) ? 28 : 24);
  }, [selectedNode, selectedLink]);

  const handleZoomIn = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 1.25);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 0.8);
    }
  };

  const handleResetZoom = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(400).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
    }
  };

  const getSourceNode = (link: NetworkLink) => {
    const srcId = typeof link.source === 'object' ? (link.source as any).id : link.source;
    return NETWORK_NODES.find(n => n.id === srcId);
  };

  const getTargetNode = (link: NetworkLink) => {
    const tgtId = typeof link.target === 'object' ? (link.target as any).id : link.target;
    return NETWORK_NODES.find(n => n.id === tgtId);
  };

  // Find all links related to currently selected node/character
  const currentCharacterLinks = selectedNode
    ? NETWORK_LINKS.filter(
        (l) => l.source === selectedNode.id || l.target === selectedNode.id ||
               (typeof l.source === 'object' && (l.source as any).id === selectedNode.id) ||
               (typeof l.target === 'object' && (l.target as any).id === selectedNode.id)
      )
    : [];

  return (
    <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-[#0a0a0c] p-6 overflow-y-auto' : ''}`}>
      {/* Top Quick Character Avatar Picker Bar */}
      <div className="bg-[#121214] p-4 border border-stone-800 rounded-sm space-y-2">
        <span className="text-[11px] font-sans text-stone-400 uppercase tracking-widest block font-bold">
          Quick Character Picker (點擊角色查看關係細節)：
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {NETWORK_NODES.map((node) => {
            const isSelected = selectedNode?.id === node.id;
            return (
              <button
                key={node.id}
                onClick={() => {
                  ambientSynth.playCardClickSFX();
                  handleSelectNode(node);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-serif-tc transition-all ${
                  isSelected
                    ? 'bg-[#8c2d2d] border-amber-400 text-white font-bold shadow-lg scale-105'
                    : 'bg-stone-900 border-stone-800 text-stone-300 hover:border-stone-600 hover:text-white'
                }`}
              >
                <img
                  src={node.image}
                  alt={node.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span>{node.name}</span>
                {isSelected && <UserCheck className="w-3 h-3 text-amber-300" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Options & Zoom Tools */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#121214] p-4 border border-stone-800 rounded-sm">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
          {filterOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                ambientSynth.playButtonClickSFX();
                setFilterType(opt.id);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-sans transition-all ${
                filterType === opt.id
                  ? 'bg-[#8c2d2d] text-white font-bold shadow-md'
                  : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomIn}
            className="p-2 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded border border-stone-800"
            title="放大"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded border border-stone-800"
            title="縮小"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-2 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded border border-stone-800"
            title="重置視角"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-[#8c2d2d]/20 border border-[#8c2d2d]/50 text-amber-300 hover:bg-[#8c2d2d] hover:text-white rounded transition-colors"
            title={isFullscreen ? '退出全螢幕' : '全螢幕檢視關聯圖'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* D3 Canvas Wrapper */}
      <div
        ref={containerRef}
        className={`relative w-full ${isFullscreen ? 'h-[60vh]' : 'h-[550px]'} bg-[#0c0c0e] border border-stone-800 rounded-sm overflow-hidden shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing`}
      >
        <svg ref={svgRef} className="w-full h-full select-none" />

        {/* Legend Hint overlay */}
        <div className="absolute top-3 left-3 pointer-events-none bg-black/75 backdrop-blur px-3 py-1.5 rounded text-[11px] text-stone-300 font-sans border border-stone-800 flex items-center gap-2 shadow-lg">
          <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>點擊人物或點擊關聯連線標籤，即可開展劇情對白解析</span>
        </div>
      </div>

      {/* Character Relationships Switcher (if a character is selected) */}
      {selectedNode && currentCharacterLinks.length > 0 && (
        <div className="bg-[#121214] p-4 border border-stone-800 rounded-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-sans text-amber-300 font-bold">
              【{selectedNode.name}】的相關宿命羈絆：
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {currentCharacterLinks.map((link) => {
              const isLinkSelected = selectedLink?.id === link.id;
              const otherNode = getSourceNode(link)?.id === selectedNode.id ? getTargetNode(link) : getSourceNode(link);

              return (
                <button
                  key={link.id}
                  onClick={() => {
                    ambientSynth.playCardClickSFX();
                    setSelectedLink(link);
                  }}
                  className={`px-3 py-1.5 rounded text-xs font-serif-tc flex items-center gap-2 transition-all border ${
                    isLinkSelected
                      ? 'bg-[#8c2d2d] border-amber-400 text-white font-bold'
                      : 'bg-stone-900 border-stone-800 text-stone-300 hover:border-stone-700'
                  }`}
                >
                  <span className="text-stone-400">與 {otherNode?.name}：</span>
                  <span>{link.relationZh}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Dialogue Detail Modal / Panel */}
      <AnimatePresence>
        {selectedLink && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="smoked-card border-2 border-[#8c2d2d] rounded-sm p-6 space-y-6 relative bg-[#18181a] shadow-2xl"
          >
            <button
              onClick={() => setSelectedLink(null)}
              className="absolute top-4 right-4 p-1 text-stone-400 hover:text-white rounded-full bg-stone-900 border border-stone-800"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header Characters Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-4 pr-8">
              <div className="flex items-center gap-4">
                {/* Source Character */}
                {getSourceNode(selectedLink) && (
                  <div className="flex items-center gap-2">
                    <img
                      src={getSourceNode(selectedLink)?.image}
                      alt={getSourceNode(selectedLink)?.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-stone-600"
                    />
                    <div>
                      <h4 className="font-serif-tc font-bold text-stone-200 text-sm">
                        {getSourceNode(selectedLink)?.name}
                      </h4>
                      <p className="text-[10px] text-stone-400 font-sans">
                        {getSourceNode(selectedLink)?.roleName}
                      </p>
                    </div>
                  </div>
                )}

                <span className="text-[#8c2d2d] font-bold text-lg font-serif">↔</span>

                {/* Target Character */}
                {getTargetNode(selectedLink) && (
                  <div className="flex items-center gap-2">
                    <img
                      src={getTargetNode(selectedLink)?.image}
                      alt={getTargetNode(selectedLink)?.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-stone-600"
                    />
                    <div>
                      <h4 className="font-serif-tc font-bold text-stone-200 text-sm">
                        {getTargetNode(selectedLink)?.name}
                      </h4>
                      <p className="text-[10px] text-stone-400 font-sans">
                        {getTargetNode(selectedLink)?.roleName}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-[#8c2d2d]/20 border border-[#8c2d2d]/50 text-amber-200 text-xs rounded font-sans font-bold">
                  {selectedLink.relationZh}
                </span>
                {selectedLink.songName && (
                  <span className="px-3 py-1 bg-stone-900 border border-stone-700 text-stone-300 text-xs rounded font-sans flex items-center gap-1">
                    <Music className="w-3 h-3 text-amber-400" />
                    <span>{selectedLink.songName}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Scene Dialogue Box */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-sans text-amber-400 uppercase tracking-widest font-bold">
                <MessageSquareQuote className="w-4 h-4" />
                <span>{selectedLink.title} — 經典原著台詞與劇本對話</span>
              </div>

              {/* English Dialogue */}
              <div className="bg-stone-950/80 border border-stone-800 p-4 rounded text-sm font-garamond italic text-stone-200 leading-relaxed whitespace-pre-line border-l-4 border-l-[#8c2d2d]">
                {selectedLink.dialogueEn}
              </div>

              {/* Chinese Translation */}
              <div className="bg-stone-900/60 border border-stone-800/80 p-4 rounded text-xs sm:text-sm font-serif-tc text-stone-300 leading-relaxed whitespace-pre-line">
                {selectedLink.dialogueZh}
              </div>

              {/* Context Explanation */}
              <div className="text-xs font-sans text-stone-400 bg-[#121214] p-3 rounded border border-stone-800/60 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span><strong className="text-stone-300">場景導讀：</strong>{selectedLink.context}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

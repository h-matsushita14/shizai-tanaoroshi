import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

function InteractiveMap({ svgPath, onAreaClick }) {
  const svgContainerRef = useRef(null);

  useEffect(() => {
    const loadAndProcessSvg = async () => {
      try {
        const response = await fetch(svgPath);
        const svgText = await response.text();
        
        if (svgContainerRef.current) {
          svgContainerRef.current.innerHTML = svgText;
          
          const svgElement = svgContainerRef.current.querySelector('svg');
          if (svgElement) {
            // Make it responsive
            svgElement.style.width = '100%';
            svgElement.style.height = 'auto';

            // Add click listeners
            const clickableElements = svgElement.querySelectorAll('[id^="L"]');
            clickableElements.forEach(element => {
              element.style.cursor = 'pointer';
              element.addEventListener('click', (event) => {
                event.stopPropagation();
                onAreaClick(element.id);
              });

              // Optional: Add hover effect
              element.addEventListener('mouseenter', () => {
                const rect = element.querySelector('rect');
                if (rect) rect.style.fill = '#FFD700'; // Highlight with gold
              });
              element.addEventListener('mouseleave', () => {
                const rect = element.querySelector('rect');
                if (rect) rect.style.fill = ''; // Revert to original color
              });
            });
          }
        }
      } catch (error) {
        console.error("Error loading SVG:", error);
      }
    };

    loadAndProcessSvg();

  }, [svgPath, onAreaClick]);

  return <Box ref={svgContainerRef} sx={{ maxWidth: '800px', margin: 'auto' }} />;
}

export default InteractiveMap;

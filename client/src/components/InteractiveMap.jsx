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
            console.log("SVG Element DOM structure:", svgElement.outerHTML); // ★追加
            // Make it responsive
            svgElement.style.width = '100%';
            svgElement.style.height = 'auto';

            // Define the mapping from SVG text content to location IDs
            const locationMap = {
              "資材室": "L0001", // This might need special handling if it's not a direct text element
              "棚A": "L0002",
              "棚B": "L0003",
              "棚C": "L0004",
              "棚D": "L0005",
              "棚E": "L0006",
              "棚F": "L0007",
              "棚G": "L0008",
              "棚H": "L0009",
              "棚I": "L0010",
              "棚J": "L0011",
              "棚K": "L0012",
              "棚L": "L0013",
              "棚M": "L0014",
              "棚N": "L0015",
              "棚O": "L0016",
              "ラック①": "L0017",
              "ラック②": "L0018",
              "ラック③": "L0019",
              "その他スペース①": "L0020",
              "その他スペース②": "L0021",
              "ナルホット関連": "L0022",
              "PC箱": "L0023",
              "PS箱": "L0024",
              "角煮箱": "L0025",
              "工場1F第二加工室": "L0029", // これはメインのrect用
              "第二加工室": "L0029", // 資材室マップ内のテキスト用
              "ラック⑤": "L0030",
              "工場1F包装室": "L0048",
              "包装室": "L0048", // ★ここを追加
              "ラック⑥": "L0049",
              "ラック⑦": "L0050",
              "ラック⑧": "L0051",
              "ラック⑨": "L0052",
              "工場1F発送室": "L0031",
              "発送室": "L0031", // ★ここを追加
              "棚①": "L0032",
              "棚②": "L0033",
              "棚③": "L0034",
              "作業台①": "L0035",
              "作業台②": "L0036",
              "化粧箱置き": "L0037",
              "工場1F出荷準備室": "L0026",
              "出荷準備室": "L0026", // ★ここを追加
              "ラック④": "L0027",
              "その他スペース③": "L0028",
              "工場1F段ボール倉庫": "L0038",
              "段ボール倉庫": "L0038", // ★ここを追加
              "段ボール①": "L0039",
              "段ボール②": "L0040",
              "化粧箱": "L0041",
              "保冷袋": "L0042",
              "ビニール袋": "L0043",
              "自販機用FP": "L0044",
              "オガ炭": "L0045",
              "紙袋": "L0046",
              "作業台③": "L0047",
            };

            // Process text elements to assign data-location-id to their parent groups
            // Process all elements with text content to assign data-location-id
            const allTextContainingElements = svgElement.querySelectorAll('text, tspan, div, span'); // テキストを含む可能性のある要素をすべて取得
            for (const element of allTextContainingElements) {
              const textContent = element.textContent.trim();
              console.log("Processing element:", element.tagName, textContent, "Length:", textContent.length); // デバッグログ
              console.log("  Comparing with locationMap key '段ボール①':", textContent === "段ボール①"); // デバッグログ
              console.log("  locationMap[textContent] value:", locationMap[textContent]); // デバッグログ

              if (locationMap[textContent]) {
                console.log("  Inside locationMap[textContent] block for:", textContent); // デバッグログ
                element.dataset.locationId = locationMap[textContent];
                console.log("  Assigned data-location-id:", element.dataset.locationId, "to", element); // デバッグログ
              }
            }

            // Special handling for "工場1F資材室" and "工場1F第二加工室" if it's not directly a text element or needs to apply to the whole map area
            const mainRectShizaiShitsu = svgElement.querySelector('rect[data-cell-id="KCVuGwIZL7oewp6tiZJl-9"]'); // This is the outer boundary rect for 資材室
            if (mainRectShizaiShitsu) {
              mainRectShizaiShitsu.dataset.locationId = locationMap["工場1F資材室"];
            }

            const mainRectDainiKakouShitsu = svgElement.querySelector('rect[data-cell-id="7TznWLomsAKnEghSVdnJ-1"]'); // This is the outer boundary rect for 第二加工室
            if (mainRectDainiKakouShitsu) {
              mainRectDainiKakouShitsu.dataset.locationId = locationMap["工場1F第二加工室"];
            }

            const mainRectHousouShitsu = svgElement.querySelector('rect[data-cell-id="6Y1NCBTZ5wwz8BtjnaaG-1"]'); // This is the outer boundary rect for 包装室
            if (mainRectHousouShitsu) {
              mainRectHousouShitsu.dataset.locationId = locationMap["工場1F包装室"];
            }

            const mainRectHassouShitsu = svgElement.querySelector('rect[data-cell-id="oX3zvODh_TOrR0j-Czdo-1"]'); // This is the outer boundary rect for 発送室
            if (mainRectHassouShitsu) {
              mainRectHassouShitsu.dataset.locationId = locationMap["工場1F発送室"];
            }

            const mainRectShukkaJunbiShitsu = svgElement.querySelector('rect[data-cell-id="9NFpFKqjHbTAQ84__Wvb-1"]'); // This is the outer boundary rect for 出荷準備室
            if (mainRectShukkaJunbiShitsu) {
              mainRectShukkaJunbiShitsu.dataset.locationId = locationMap["工場1F出荷準備室"];
            }

            const mainRectDanboruSoko = svgElement.querySelector('rect[data-cell-id="S7_gQO1z6frh0wZgUaGq-1"]'); // This is the outer boundary rect for 段ボール倉庫
            if (mainRectDanboruSoko) {
              mainRectDanboruSoko.dataset.locationId = locationMap["工場1F段ボール倉庫"];
            }


            // Add click listeners to elements with data-location-id
            const clickableElements = svgElement.querySelectorAll('[data-location-id]');
            clickableElements.forEach(element => {
              element.style.cursor = 'pointer';
              element.addEventListener('click', (event) => {
                event.stopPropagation();
                onAreaClick(element.dataset.locationId);
              });

              // Optional: Add hover effect
              let originalFill = ''; // 初期化

              element.addEventListener('mouseenter', () => {
                let targetShapeElement = null;

                // element自身が図形要素の場合
                if (element.tagName === 'rect' || element.tagName === 'path' || element.tagName === 'circle' || element.tagName === 'ellipse' || element.tagName === 'polygon' || element.tagName === 'line') {
                  targetShapeElement = element;
                } else {
                  // elementがテキスト要素の場合、その親の図形要素を探す
                  targetShapeElement = element.closest('rect, path, circle, ellipse, polygon, line');
                }

                // もし図形要素が見つからなければ、その親のg要素を探す
                if (!targetShapeElement) {
                  targetShapeElement = element.closest('g');
                }

                console.log("MouseEnter: element:", element.tagName, element.textContent.trim()); // ★追加
                console.log("  targetShapeElement:", targetShapeElement); // ★追加

                if (targetShapeElement) {
                  originalFill = targetShapeElement.style.fill; // 元のfillスタイルを保存
                  console.log("  originalFill:", originalFill); // ★追加
                  targetShapeElement.style.fill = '#FFD700'; // ハイライト色
                }
              });

              element.addEventListener('mouseleave', () => {
                let targetShapeElement = null;

                if (element.tagName === 'rect' || element.tagName === 'path' || element.tagName === 'circle' || element.tagName === 'ellipse' || element.tagName === 'polygon' || element.tagName === 'line') {
                  targetShapeElement = element;
                } else {
                  targetShapeElement = element.closest('rect, path, circle, ellipse, polygon, line');
                }

                if (!targetShapeElement) {
                  targetShapeElement = element.closest('g');
                }
                
                console.log("MouseLeave: element:", element.tagName, element.textContent.trim()); // ★追加
                console.log("  targetShapeElement:", targetShapeElement); // ★追加
                console.log("  restoring originalFill:", originalFill); // ★追加

                if (targetShapeElement) {
                  targetShapeElement.style.fill = originalFill; // 元の色に戻す
                }
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

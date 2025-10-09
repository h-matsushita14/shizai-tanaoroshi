import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

const mapSettings = {
  '資材室.svg': { marginTop: 0, marginBottom: 20, marginLeft: 5, marginRight: 5 }, // 上部の余白をなくし、下部に余裕を持たせる
  '出荷準備室.svg': { marginTop: 0, marginBottom: 20, marginLeft: 5, marginRight: 5 }, // 同上
  '第二加工室.svg': { marginTop: 5, marginBottom: 5, marginLeft: 5, marginRight: 5 }, // 微調整
  '段ボール倉庫.svg': { marginTop: 5, marginBottom: 5, marginLeft: 5, marginRight: 5 }, // 上部の余白を減らす
  '発送室.svg': { marginTop: 0, marginBottom: 20, marginLeft: 5, marginRight: 5 }, // 上部の余白をなくし、下部に余裕を持たせる
  '包装室.svg': { marginTop: 5, marginBottom: 5, marginLeft: 5, marginRight: 5 }, // 同上
  // デフォルト値
  default: { marginTop: 10, marginBottom: 10, marginLeft: 10, marginRight: 10 }
};

function InteractiveMap({ svgPath, onAreaClick }) {
  const svgContainerRef = useRef(null);

  useEffect(() => {
    const loadAndProcessSvg = async () => {
      if (!svgContainerRef.current) return;

      try {
        const response = await fetch(svgPath);
        const svgText = await response.text();
        
        if (svgContainerRef.current) {
          svgContainerRef.current.innerHTML = svgText;
          
          const svgElement = svgContainerRef.current.querySelector('svg');
          if (svgElement) {
            console.log("SVG Element DOM structure:", svgElement.outerHTML); // ★追加

            // SVGコンテンツの境界ボックスを取得
            // getBBox()はSVG要素がDOMに完全にロードされてからでないと正確な値を返さない場合があるため、
            // 少し遅延させるか、DOMContentLoadedイベントなどを待つ必要があるかもしれません。
            // ここでは簡略化のため直接呼び出しますが、問題があれば調整が必要です。
            const bbox = svgElement.getBBox();
            console.log("SVG BBox:", bbox);
            console.log("SVG clientHeight:", svgElement.clientHeight); // 追加
            console.log("SVG scrollHeight:", svgElement.scrollHeight); // 追加

            // マップごとの設定を取得
            const currentMapFileName = svgPath.split('/').pop();
            const settings = mapSettings[currentMapFileName] || mapSettings.default; // デフォルト設定を使用

            const marginTop = settings.marginTop;
            const marginBottom = settings.marginBottom;
            const marginLeft = settings.marginLeft;
            const marginRight = settings.marginRight;

            const newViewBoxX = bbox.x - marginLeft;
            const newViewBoxY = bbox.y - marginTop;
            const newViewBoxWidth = bbox.width + marginLeft + marginRight;
            const newViewBoxHeight = bbox.height + marginTop + marginBottom;

            console.log("New viewBox values:", { newViewBoxX, newViewBoxY, newViewBoxWidth, newViewBoxHeight }); // 追加

            // viewBoxを動的に設定して余白をトリミングし、マージンを追加
            svgElement.setAttribute('viewBox', `${newViewBoxX} ${newViewBoxY} ${newViewBoxWidth} ${newViewBoxHeight}`);
            svgElement.setAttribute('preserveAspectRatio', 'xMinYMin meet');

            // Make it responsive (これらはviewBoxとpreserveAspectRatioで制御されるため、不要になる可能性もありますが、念のため残します)
            svgElement.style.maxWidth = '100%';
            svgElement.style.maxHeight = '100%';

            // Remove the title text element from the SVG
            const mapName = svgPath.split('/').pop().replace('.svg', '');
            const allTextElements = svgElement.querySelectorAll('text');
            allTextElements.forEach(textEl => {
              if (textEl.textContent.trim() === mapName) {
                const parentGroup = textEl.closest('g');
                // If it's in a group, remove the group. Otherwise, remove the text element itself.
                if (parentGroup) {
                  parentGroup.remove();
                } else {
                  textEl.remove();
                }
              }
            });

            // Define the mapping from SVG text content to location IDs
            const locationMap = {
              "資材室": "L0001",
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
              "その他スペース③": "L0022",
              "その他スペース④": "L0023",
              "工場1F出荷準備室": "L0026",
              "出荷準備室": "L0026",
              "ラック④": "L0027",
              "その他スペース⑤": "L0028",
              "工場1F第二加工室": "L0029",
              "第二加工室": "L0029",
              "ラック⑤": "L0030",
              "工場1F発送室": "L0031",
              "発送室": "L0031",
              "棚①": "L0032",
              "棚②": "L0033",
              "棚③": "L0034",
              "作業台①": "L0035",
              "作業台②": "L0036",
              "その他スペース⑥": "L0037",
              "工場1F段ボール倉庫": "L0038",
              "段ボール倉庫": "L0038",
              "南側": "L0039",
              "西側": "L0040",
              "北側": "L0041",
              "その他スペース⑦": "L0042",
              "東側": "L0043",
              "作業台③": "L0047",
              "工場1F包装室": "L0048",
              "包装室": "L0048",
              "ラック⑥": "L0049",
              "ラック⑦": "L0050",
              "ラック⑧": "L0051",
              "ラック⑨": "L0052",
              "工場1Fサニタリー": "L0053",
              "サニタリー": "L0053",
              "工場1F催事倉庫": "L0054",
              "催事倉庫": "L0054",
              "工場2F事務所": "L0055",
              "事務所": "L0055",
              "工場2F書庫": "L0056",
              "書庫": "L0056",
              "工場2F休憩室": "L0057",
              "休憩室": "L0057",
              "その他プレハブ": "L0058",
              "プレハブ": "L0058",
              "その他コンテナ": "L0059",
              "コンテナ": "L0059",
              "その他ロジセン": "L0060",
              "ロジセン": "L0060",
              "工場1F製品冷凍庫": "L0061",
              "製品冷凍庫": "L0061",
            };

            // Process text elements to assign data-location-id to their parent groups
            // Process all elements with text content to assign data-location-id
            // SVGのtext要素とtspan要素のみを対象とする
            const allTextContainingElements = svgElement.querySelectorAll('text, tspan'); 
            for (const element of allTextContainingElements) {
              const textContent = element.textContent.trim();
              // デバッグログを追加
              console.log(`[Assign ID] Processing: ${textContent} (Tag: ${element.tagName})`);
              if (locationMap[textContent]) {
                element.dataset.locationId = locationMap[textContent];
                console.log(`[Assign ID] Assigned ${locationMap[textContent]} to ${textContent}`);
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
            // SVGの図形要素とtext要素のみを対象とする
            const clickableElements = svgElement.querySelectorAll('rect[data-location-id], path[data-location-id], circle[data-location-id], ellipse[data-location-id], polygon[data-location-id], line[data-location-id], text[data-location-id]');
            clickableElements.forEach(element => {
              // デバッグログを追加
              console.log(`[Clickable] Element: ${element.tagName}, Text: ${element.textContent.trim()}, ID: ${element.dataset.locationId}`);

              element.style.cursor = 'pointer';
              element.addEventListener('click', (event) => {
                event.stopPropagation();
                console.log("onAreaClick called with:", element.dataset.locationId); // 追加
                onAreaClick(element.dataset.locationId);
              });

              let originalFill = '';
              let targetElementForHover = null; // ホバーエフェクトを適用する実際の要素

              element.addEventListener('mouseenter', (event) => { // event引数を追加
                event.stopPropagation(); // イベントのバブリングを抑制

                // デバッグログを追加
                console.log(`[MouseEnter] Element: ${element.tagName}, Text: ${element.textContent.trim()}, ID: ${element.dataset.locationId}`);

                // ホバーエフェクトを適用する要素を決定
                // element自身がdata-location-idを持つSVG図形要素またはtext要素であるため、それを直接対象とする
                targetElementForHover = element;

                // デバッグログを追加
                console.log(`[MouseEnter] targetElementForHover: ${targetElementForHover ? targetElementForHover.tagName : 'null'}`);

                if (targetElementForHover) {
                  // originalFillを正確に取得: まず属性、次にスタイル、最後に計算済みスタイル
                  // ただし、text要素の場合、fillは親のg要素から継承されることが多い
                  // そのため、text要素の場合は親のg要素のfillを考慮する
                  if (targetElementForHover.tagName === 'text') {
                    const parentG = targetElementForHover.closest('g');
                    if (parentG) {
                      originalFill = parentG.getAttribute('fill') || parentG.style.fill || getComputedStyle(parentG).fill;
                    } else {
                      originalFill = targetElementForHover.getAttribute('fill') || targetElementForHover.style.fill || getComputedStyle(targetElementForHover).fill;
                    }
                  } else {
                    originalFill = targetElementForHover.getAttribute('fill') || targetElementForHover.style.fill || getComputedStyle(targetElementForHover).fill;
                  }
                  
                  // デバッグログを追加
                  console.log(`[MouseEnter] originalFill: ${originalFill}`);
                  targetElementForHover.style.fill = '#FFD700'; // ハイライト色
                }
              });

              element.addEventListener('mouseleave', (event) => { // event引数を追加
                event.stopPropagation(); // イベントのバブリングを抑制

                // デバッグログを追加
                console.log(`[MouseLeave] Element: ${element.tagName}, Text: ${element.textContent.trim()}, ID: ${element.dataset.locationId}`);
                if (targetElementForHover) {
                  targetElementForHover.style.fill = originalFill; // 元の色に戻す
                  // デバッグログを追加
                  console.log(`[MouseLeave] Restored fill to: ${originalFill}`);
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

  return (
    <Box 
            ref={svgContainerRef}
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              // justifyContent: 'center', // 中央寄せを削除
              // alignItems: 'center' // 中央寄せを削除
              justifyContent: 'flex-start', // 左寄せ
              alignItems: 'flex-start', // 上寄せ
              overflow: 'auto', // 必要に応じてスクロールバーを表示
            }}
          />  );
}

export default InteractiveMap;

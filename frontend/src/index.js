import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// Visual Editor Mode - Enable element selection when ?ve=1 is present
if (window.location.search.includes('ve=1')) {
  // Wait for React to render
  setTimeout(() => {
    document.body.style.cursor = 'crosshair';
    
    // Add visual indicator style
    const style = document.createElement('style');
    style.textContent = `
      .ve-selected { outline: 2px solid #C4714A !important; box-shadow: 0 0 10px rgba(196, 113, 74, 0.5) !important; }
      body { cursor: crosshair !important; }
      * { cursor: crosshair !important; }
    `;
    document.head.appendChild(style);
    
    // Add click handler for element selection
    document.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const target = e.target;
      
      // Don't select the body or html
      if (target === document.body || target === document.documentElement) return;
      
      // Remove previous selection highlight
      document.querySelectorAll('.ve-selected').forEach(el => {
        el.classList.remove('ve-selected');
      });
      
      // Highlight selected element
      target.classList.add('ve-selected');
      
      // Generate a unique ID if not present
      if (!target.dataset.veId) {
        target.dataset.veId = 'el-' + Math.random().toString(36).substr(2, 9);
      }
      
      // Send selection to parent/opener window
      const message = {
        type: 'element-selected',
        element: {
          id: target.dataset.veId,
          tagName: target.tagName,
          content: target.tagName === 'IMG' ? target.src : (target.textContent || '').substring(0, 500),
          styles: {
            color: getComputedStyle(target).color,
            backgroundColor: getComputedStyle(target).backgroundColor,
            fontSize: getComputedStyle(target).fontSize,
          },
          href: target.href || null,
          className: target.className
        }
      };
      
      if (window.opener) {
        window.opener.postMessage(message, '*');
      }
      if (window.parent !== window) {
        window.parent.postMessage(message, '*');
      }
    }, true);
    
    console.log('Visual Editor mode enabled');
  }, 1500);
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

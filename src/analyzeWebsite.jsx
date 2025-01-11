import axe from 'axe-core';

export const analyzeWebsite = (html) => {
    // Parse the HTML string into a DOM Document
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

  
    const violations = [];
  
    // 1. Check <img> elements for alt attributes
    const images = Array.from(doc.querySelectorAll("img"));
    const missingAlt = images
      .filter((img) => !img.hasAttribute("alt") || img.getAttribute("alt").trim() === "")
      .map((img) => ({ element: img.outerHTML, description: "Missing alt attribute" }));
    if (missingAlt.length) {
      violations.push({
        id: "image-alt",
        description: "Image elements are missing alt attributes.",
        severity: "critical",
        nodes: missingAlt,
      });
    }
  
    // 2. Check form elements for associated labels
    const formElements = Array.from(doc.querySelectorAll("input, textarea, select, button"));
    const unlabeledFormElements = formElements
      .filter((el) => !el.labels?.length && !el.getAttribute("aria-label") && !el.getAttribute("aria-labelledby"))
      .map((el) => ({ element: el.outerHTML, description: "Form control is missing an associated label" }));
    if (unlabeledFormElements.length) {
      violations.push({
        id: "form-label",
        description: "Form elements are missing associated labels.",
        severity: "critical",
        nodes: unlabeledFormElements,
      });
    }
  
    // 3. Check text contrast
    const textElements = Array.from(doc.querySelectorAll("*")).filter((el) =>
      window.getComputedStyle(el).getPropertyValue("color")
    );
    const lowContrast = textElements
      .filter((el) => {
        const style = window.getComputedStyle(el);
        const fgColor = style.color;
        const bgColor = style.backgroundColor || "rgb(255, 255, 255)";
        const ratio = calculateContrastRatio(fgColor, bgColor);
        return ratio < 4.5; // Default WCAG threshold
      })
      .map((el) => ({ element: el.outerHTML, description: "Low text contrast" }));
    if (lowContrast.length) {
      violations.push({
        id: "contrast",
        description: "Text contrast is below WCAG recommended levels.",
        severity: "moderate",
        nodes: lowContrast,
      });
    }
  
    // 4. Check for charts and graphs missing text alternatives
    const graphs = Array.from(doc.querySelectorAll("svg, canvas, [role='img']"));
    const missingTextAlt = graphs
      .filter((el) => !el.getAttribute("aria-label") && !el.getAttribute("aria-labelledby"))
      .map((el) => ({ element: el.outerHTML, description: "Missing text alternative for chart/graph" }));
    if (missingTextAlt.length) {
      violations.push({
        id: "chart-alt",
        description: "Charts or graphs are missing text alternatives.",
        severity: "critical",
        nodes: missingTextAlt,
      });
    }
  
    // 5. Check for data tables without <th> elements
    const tables = Array.from(doc.querySelectorAll("table"));
    const tablesWithoutHeaders = tables
      .filter((table) => !table.querySelector("th"))
      .map((table) => ({ element: table.outerHTML, description: "Table is missing header cells" }));
    if (tablesWithoutHeaders.length) {
      violations.push({
        id: "table-headers",
        description: "Data tables are missing header cells.",
        severity: "critical",
        nodes: tablesWithoutHeaders,
      });
    }
  
    // 6. Check for fieldsets without legends
    const fieldsets = Array.from(doc.querySelectorAll("fieldset"));
    const fieldsetsWithoutLegends = fieldsets
      .filter((fieldset) => !fieldset.querySelector("legend"))
      .map((fieldset) => ({ element: fieldset.outerHTML, description: "Fieldset is missing a legend" }));
    if (fieldsetsWithoutLegends.length) {
      violations.push({
        id: "fieldset-legend",
        description: "Fieldsets are missing legends.",
        severity: "minor",
        nodes: fieldsetsWithoutLegends,
      });
    }
  
    // 7. Check for incorrect landmark usage
    const landmarks = Array.from(doc.querySelectorAll("header, main, footer, nav, aside"));
    const incorrectLandmarks = landmarks
      .filter((landmark) => !landmark.getAttribute("role") && !landmark.getAttribute("aria-label"))
      .map((landmark) => ({ element: landmark.outerHTML, description: "Landmark is missing role or label" }));
    if (incorrectLandmarks.length) {
      violations.push({
        id: "landmark",
        description: "Landmark regions are missing proper roles or labels.",
        severity: "moderate",
        nodes: incorrectLandmarks,
      });
    }
  
    return violations;
  };

  export const additionalChecks = async (html) => {
    // Parse the HTML string into a DOM Document
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
  
    // Run axe-core on the parsed document
    const results = await axe.run(doc);
  
    return results.violations;
  };

  // Helper function to calculate contrast ratio
  const calculateContrastRatio = (fgColor, bgColor) => {
    const getLuminance = (color) => {
      const rgb = color
        .replace(/[^\d,]/g, "")
        .split(",")
        .map((v) => parseInt(v, 10) / 255)
        .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
      return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    };
    const fgLuminance = getLuminance(fgColor);
    const bgLuminance = getLuminance(bgColor);
    return (Math.max(fgLuminance, bgLuminance) + 0.05) / (Math.min(fgLuminance, bgLuminance) + 0.05);
  };
  
import axe from 'axe-core';

export const analyzeWebsite = (html) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const violations = [];

  const escapeRegExp = (string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special characters
  };
  // Utility function to get line numbers from elements
  const getElementLineNumber = (element) => {
    const sourceCodeLines = html.split('\n');
    const tagName = element.tagName.toLowerCase();
    const attributes = Array.from(element.attributes)
        .map(attr => `${attr.name}="${attr.value}"`)
        .join(' ');

    // Escape attributes to prevent RegExp errors
    const escapedAttributes = escapeRegExp(attributes);

    // Build a safer search pattern
    const pattern = new RegExp(`<${tagName}(\\s+${escapedAttributes})?.*?>`, 'i');

    for (let i = 0; i < sourceCodeLines.length; i++) {
        if (pattern.test(sourceCodeLines[i])) {
            return i + 1; // Line numbers are 1-based
        }
    }


      return null;
  };

  
  // 20. Check if the viewport meta tag restricts scaling
const metaViewport = doc.querySelector("meta[name='viewport']");
if (metaViewport) {
  const content = metaViewport.getAttribute("content") || "";
  const disallowedProperties = ["maximum-scale=1", "user-scalable=no"];
  const isZoomRestricted = disallowedProperties.some((prop) => content.includes(prop));

  if (isZoomRestricted) {
    violations.push({
      id: "zoom-resize-viewport",
      description: "The viewport meta tag restricts user zooming.",
      severity: "critical",
      nodes: [{
        element: metaViewport.outerHTML,
        line: getElementLineNumber(metaViewport),
      }],
    });
  }
} else {
  violations.push({
    id: "zoom-resize-viewport-missing",
    description: "The page is missing a viewport meta tag.",
    severity: "moderate",
    nodes: [],
  });
}
  // 2. Check form elements for associated labels
  const formElements = Array.from(doc.querySelectorAll("input, textarea, select, button"));
  const unlabeledFormElements = formElements
      .filter((el) => !el.labels?.length && !el.getAttribute("aria-label") && !el.getAttribute("aria-labelledby"))
      .map((el) => ({
          element: el.outerHTML,
          line: getElementLineNumber(el),
          description: "Form control is missing an associated label",
      }));
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
.map((el) => ({
  element: el.outerHTML,
  line: getElementLineNumber(el),
  description: "Low text contrast",
}));
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
.map((el) => ({
  element: el.outerHTML,
  line: getElementLineNumber(el),
  description: "Missing text alternative for chart/graph",
}));
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
.map((table) => ({
  element: table.outerHTML,
  line: getElementLineNumber(table),
  description: "Table is missing header cells",
}));
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
.map((fieldset) => ({
  element: fieldset.outerHTML,
  line: getElementLineNumber(fieldset),
  description: "Fieldset is missing a legend",
}));
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
.map((landmark) => ({
  element: landmark.outerHTML,
  line: getElementLineNumber(landmark),
  description: "Landmark is missing role or label",
}));
if (incorrectLandmarks.length) {
violations.push({
  id: "landmark",
  description: "Landmark regions are missing proper roles or labels.",
  severity: "moderate",
  nodes: incorrectLandmarks,
});
}

// 8. Headings properly nested
const headings = Array.from(doc.querySelectorAll("h1, h2, h3, h4, h5, h6"));
let previousLevel = 0;
const improperHeadings = headings
.filter((heading) => {
  const level = parseInt(heading.tagName[1], 10);
  const isImproper = level > previousLevel + 1;
  previousLevel = level;
  return isImproper;
})
.map((heading) => ({
  element: heading.outerHTML,
  line: getElementLineNumber(heading),
  description: "Improper heading nesting",
}));
if (improperHeadings.length) {
violations.push({
  id: "headings",
  description: "Headings must be properly nested.",
  severity: "moderate",
  nodes: improperHeadings,
});
}

// 9. Links missing discernible text
const links = Array.from(doc.querySelectorAll("a"));
const missingLinkText = links
.filter(
  (link) =>
    (!link.textContent.trim() && !link.getAttribute("aria-label")) ||
    link.getAttribute("href") === "#"
)
.map((link) => ({
  element: link.outerHTML,
  line: getElementLineNumber(link),
  description: "Link lacks discernible text",
}));
if (missingLinkText.length) {
violations.push({
  id: "link-name",
  description: "Links must have discernible text.",
  severity: "critical",
  nodes: missingLinkText,
});
}


 // 10. Focusable elements with accessible names
const focusableElements = Array.from(doc.querySelectorAll("a, button, input, textarea, select, [tabindex]"));
const focusableWithoutName = focusableElements
  .filter((el) => !el.textContent.trim() && !el.getAttribute("aria-label") && !el.getAttribute("aria-labelledby"))
  .map((el) => ({
    element: el.outerHTML,
    line: getElementLineNumber(el),
    description: "Focusable element lacks accessible name",
  }));
if (focusableWithoutName.length) {
  violations.push({
    id: "focusable-name",
    description: "Focusable elements must have accessible names.",
    severity: "critical",
    nodes: focusableWithoutName,
  });
}

// 11. Document must have a <title>
const titleElement = doc.querySelector("title");
if (!titleElement || !titleElement.textContent.trim()) {
  violations.push({
    id: "missing-title",
    description: "The document is missing a <title> element or it is empty.",
    severity: "critical",
    nodes: [],
  });
}

// 12. Document language attribute
const htmlLang = doc.documentElement.getAttribute("lang");
if (!htmlLang) {
  violations.push({
    id: "missing-lang",
    description: "The <html> element is missing a lang attribute.",
    severity: "critical",
    nodes: [],
  });
}

// 13. Avoid tabindex > 0
const highTabindex = focusableElements
  .filter((el) => el.tabIndex > 0)
  .map((el) => ({
    element: el.outerHTML,
    line: getElementLineNumber(el),
    description: "Tabindex greater than 0",
  }));
if (highTabindex.length) {
  violations.push({
    id: "high-tabindex",
    description: "Avoid tabindex values greater than 0.",
    severity: "moderate",
    nodes: highTabindex,
  });
}

// 14. No duplicate ARIA roles
const singleUseRoles = ["banner", "main", "navigation"];
singleUseRoles.forEach((role) => {
  const roleElements = doc.querySelectorAll(`[role='${role}']`);
  if (roleElements.length > 1) {
    violations.push({
      id: `duplicate-role-${role}`,
      description: `Multiple elements use the ARIA role '${role}', which should be unique.`,
      severity: "moderate",
      nodes: Array.from(roleElements).map((el) => ({
        element: el.outerHTML,
        line: getElementLineNumber(el),
      })),
    });
  }
});

// 15. Ensure iframes have titles
const iframes = Array.from(doc.querySelectorAll("iframe"));
const untitledIframes = iframes
  .filter((iframe) => !iframe.getAttribute("title"))
  .map((iframe) => ({
    element: iframe.outerHTML,
    line: getElementLineNumber(iframe),
    description: "Iframe is missing a title attribute",
  }));
if (untitledIframes.length) {
  violations.push({
    id: "iframe-title",
    description: "All iframes must have a title attribute.",
    severity: "critical",
    nodes: untitledIframes,
  });
}

// 16. No empty links or buttons
const emptyLinksAndButtons = Array.from(doc.querySelectorAll("a, button"))
  .filter((el) => !el.textContent.trim() && !el.getAttribute("aria-label") && !el.getAttribute("aria-labelledby"))
  .map((el) => ({
    element: el.outerHTML,
    line: getElementLineNumber(el),
    description: "Empty link or button",
  }));
if (emptyLinksAndButtons.length) {
  violations.push({
    id: "empty-links-buttons",
    description: "Links and buttons must not be empty.",
    severity: "critical",
    nodes: emptyLinksAndButtons,
  });
}

// 17. Ensure no duplicate IDs
const allElements = Array.from(doc.querySelectorAll("*"));
const ids = allElements.map((el) => el.id).filter((id) => id);
const duplicateIds = ids.filter((id, index, self) => self.indexOf(id) !== index);
if (duplicateIds.length) {
  duplicateIds.forEach((id) => {
    const elements = allElements.filter((el) => el.id === id);
    violations.push({
      id: "duplicate-id",
      description: `Duplicate ID found: '${id}'.`,
      severity: "critical",
      nodes: elements.map((el) => ({
        element: el.outerHTML,
        line: getElementLineNumber(el),
      })),
    });
  });
}


    // 18. Ensure audio/video has captions or transcripts
const mediaElements = Array.from(doc.querySelectorAll("audio, video"));
const mediaWithoutTextAlternatives = mediaElements
  .filter((el) => !el.querySelector("track[kind='captions']") && !el.getAttribute("aria-describedby"))
  .map((el) => ({
    element: el.outerHTML,
    line: getElementLineNumber(el),
    description: "Media element is missing captions or transcripts",
  }));
if (mediaWithoutTextAlternatives.length) {
  violations.push({
    id: "media-alternatives",
    description: "Audio and video elements must have captions or transcripts.",
    severity: "critical",
    nodes: mediaWithoutTextAlternatives,
  });
}

// 19. Ensure landmarks are appropriately labeled
const landmarkRoles = ["banner", "main", "navigation", "complementary", "contentinfo"];
const unlabeledLandmarks = Array.from(doc.querySelectorAll(landmarkRoles.map((role) => `[role='${role}']`).join(", ")))
  .filter((el) => !el.getAttribute("aria-label") && !el.getAttribute("aria-labelledby"))
  .map((el) => ({
    element: el.outerHTML,
    line: getElementLineNumber(el),
    description: "Landmark is missing a label",
  }));
if (unlabeledLandmarks.length) {
  violations.push({
    id: "unlabeled-landmarks",
    description: "Landmarks must have accessible labels.",
    severity: "moderate",
    nodes: unlabeledLandmarks,
  });
}

// 20. Check <img> elements for alt attributes
const images = Array.from(doc.querySelectorAll("img"));
const missingAlt = images
    .filter((img) => !img.hasAttribute("alt") || img.getAttribute("alt").trim() === "")
    .map((img) => ({
        element: img.outerHTML,
        line: getElementLineNumber(img),
        description: "Missing alt attribute",
    }));
if (missingAlt.length) {
    violations.push({
        id: "image-alt",
        description: "Image elements are missing alt attributes.",
        severity: "critical",
        nodes: missingAlt,
    });
}

// 21. Check for CSS or JavaScript restrictions on zoom or text resizing
const bodyStyle = window.getComputedStyle(doc.body);
const restrictedProperties = [
  { property: "zoom", value: "1" },
  { property: "text-size-adjust", value: "none" },
];

restrictedProperties.forEach(({ property, value }) => {
  const currentValue = bodyStyle.getPropertyValue(property);
  if (currentValue === value) {
    violations.push({
      id: `zoom-resize-${property}`,
      description: `The page restricts zoom or text resizing using CSS property: ${property}.`,
      severity: "moderate",
      nodes: [{
        element: `<body style="${property}: ${currentValue};">`,
        line: getElementLineNumber(doc.body), // Assuming line of the body element
      }],
    });
  }
});


    return violations;
  };

  export const analyzeWebsites = async (html) => {
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
  
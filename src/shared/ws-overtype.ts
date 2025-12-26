import OverType from "overtype";
import m from "mithril";

function overtypeOptions(vnode) {
  // Helper to get CSS variable value
  const getCSSVar = (varName) => {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  };

  // Helper to add transparency to a color (works with oklch, rgb, hex)
  const addAlpha = (color, alpha = 0.4) => {
    if (!color) return color;
    // If it's already an oklch color, add alpha
    if (color.startsWith('oklch(')) {
      return color.replace(')', ` / ${alpha})`);
    }
    // If it's a hex color, convert to rgba
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    // If it's already rgba or has transparency, return as is
    return color;
  };

  const previewTheme = {
    name: "ws-flow-preview-theme",
    colors: {
      bgPrimary: getCSSVar('--color-base-100') || "oklch(98% 0 0)",
      bgSecondary: getCSSVar('--color-base-100') || "oklch(98% 0 0)",
      text: getCSSVar('--color-base-content') || "#0d3b66",
      textPrimary: getCSSVar('--color-base-content') || "#0d3b66",
      textSecondary: getCSSVar('--color-neutral-content') || "#5a7a9b",
      h1: getCSSVar('--color-error') || "#f95738",
      h2: getCSSVar('--color-warning') || "#ee964b",
      h3: getCSSVar('--color-success') || "#3d8a51",
      strong: getCSSVar('--color-warning') || "#ee964b",
      em: getCSSVar('--color-error') || "#f95738",
      del: getCSSVar('--color-warning') || "#ee964b",
      link: getCSSVar('--color-info') || "#0d3b66",
      code: getCSSVar('--color-accent-content') || "#0d3b66",
      codeBg: getCSSVar('--color-base-200') || "rgba(244, 211, 94, 0.4)",
      blockquote: getCSSVar('--color-neutral-content') || "#5a7a9b",
      hr: getCSSVar('--color-neutral') || "#5a7a9b",
      syntaxMarker: getCSSVar('--color-base-content') || "rgba(13, 59, 102, 0.52)",
      syntax: getCSSVar('--color-neutral-content') || "#999999",
      cursor: getCSSVar('--color-primary') || "#f95738",
      selection: addAlpha(getCSSVar('--color-base-200'), 0.4) || "rgba(244, 211, 94, 0.4)",
      listMarker: getCSSVar('--color-warning') || "#ee964b",
      rawLine: getCSSVar('--color-neutral-content') || "#5a7a9b",
      border: getCSSVar('--color-base-300') || "#e0e0e0",
      hoverBg: getCSSVar('--color-base-200') || "#f0f0f0",
      primary: getCSSVar('--color-primary') || "#0d3b66",
      // Toolbar colors
      toolbarBg: getCSSVar('--color-base-100') || "#ffffff",
      toolbarIcon: getCSSVar('--color-base-content') || "#0d3b66",
      toolbarHover: getCSSVar('--color-base-200') || "#f5f5f5",
      toolbarActive: getCSSVar('--color-primary') || "#faf0ca",
    },
  };

  const editTheme = {
    name: "ws-flow-edit-theme",
    colors: {
      bgPrimary: getCSSVar('--color-base-200') || "#fff8e7",
      bgSecondary: getCSSVar('--color-base-100') || "#fffcf5",
      text: getCSSVar('--color-base-content') || "#1a4d2e",
      textPrimary: getCSSVar('--color-base-content') || "#1a4d2e",
      textSecondary: getCSSVar('--color-neutral-content') || "#4a7c59",
      h1: getCSSVar('--color-error') || "#d84315",
      h2: getCSSVar('--color-warning') || "#f57c00",
      h3: getCSSVar('--color-success') || "#2e7d32",
      strong: getCSSVar('--color-warning') || "#f57c00",
      em: getCSSVar('--color-error') || "#d84315",
      del: getCSSVar('--color-warning') || "#f57c00",
      link: getCSSVar('--color-info') || "#1a4d2e",
      code: getCSSVar('--color-accent-content') || "#1a4d2e",
      codeBg: getCSSVar('--color-base-300') || "rgba(255, 224, 130, 0.3)",
      blockquote: getCSSVar('--color-neutral-content') || "#4a7c59",
      hr: getCSSVar('--color-neutral') || "#4a7c59",
      syntaxMarker: getCSSVar('--color-base-content') || "rgba(26, 77, 46, 0.52)",
      syntax: getCSSVar('--color-neutral-content') || "#888888",
      cursor: getCSSVar('--color-primary') || "#d84315",
      selection: addAlpha(getCSSVar('--color-base-300'), 0.5) || "rgba(255, 224, 130, 0.5)",
      listMarker: getCSSVar('--color-warning') || "#f57c00",
      rawLine: getCSSVar('--color-neutral-content') || "#4a7c59",
      border: getCSSVar('--color-base-300') || "#e0c896",
      hoverBg: getCSSVar('--color-base-200') || "#fff4d6",
      primary: getCSSVar('--color-primary') || "#1a4d2e",
      // Toolbar colors
      toolbarBg: getCSSVar('--color-base-100') || "#fffcf5",
      toolbarIcon: getCSSVar('--color-base-content') || "#1a4d2e",
      toolbarHover: getCSSVar('--color-base-200') || "#fff8e7",
      toolbarActive: getCSSVar('--color-primary') || "#ffe082",
    },
  };

  return {
    value: vnode.attrs.value || "",
    placeholder: vnode.attrs.placeholder || "",
    toolbar: vnode.attrs.toolbar || true,
    onChange: (editor) => {
      const value = editor.getValue();
      vnode.attrs.onChange && vnode.attrs.onChange(value);
      vnode.attrs.onKeydown && vnode.attrs.onKeydown(value);
    },
    autoResize: true,
    padding: vnode.attrs.padding || "4px",
    minHeight: vnode.attrs.minHeight || "40px",
    fontFamily:
      vnode.attrs.fontFamily ||
      '"SF Mono", SFMono-Regular, Menlo, Monaco, "Cascadia Code", Consolas, "Roboto Mono", "Noto Sans Mono", "Droid Sans Mono", "Ubuntu Mono", "DejaVu Sans Mono", "Liberation Mono", "Courier New", Courier, monospace',
    fontSize: vnode.attrs.fontSize || "16px",
    lineHeight: vnode.attrs.lineHeight || "1.5",
    theme: vnode.attrs.preview ? previewTheme : editTheme,
  };
}

export const OvertypeBase = {
  editors: [],
  oncreate(vnode) {
    const options = overtypeOptions(vnode);
    vnode.state.editors = OverType.init(vnode.dom, options);
    for (const editor of vnode.state.editors) {
      vnode.dom._overtype = editor;
      vnode.attrs.preview && editor.showPreviewMode();
      break;
    }

    const overTypePreview = vnode.dom.querySelector(".overtype-preview");
    // match the preview styles to the editor options
    overTypePreview.style.setProperty(
      "font-size",
      options.fontSize,
      "important"
    );
    overTypePreview.style.setProperty(
      "line-height",
      options.lineHeight,
      "important"
    );
    overTypePreview.style.setProperty(
      "font-family",
      options.fontFamily,
      "important"
    );
    this.onupdate(vnode);
  },
  onremove(vnode) {
    for (const editor of vnode.state.editors) {
      editor.destroy();
    }
    vnode.state.editors = [];
  },
  onbeforeupdate(vnode) {
    const { theme } = overtypeOptions(vnode);
    for (const editor of vnode.state.editors) {
      if (vnode.attrs.preview) {
        editor.showPreviewMode();
        editor.setTheme(theme);
        editor.setValue(vnode.attrs.value || "");
      } else {
        editor.showNormalEditMode();
        editor.setTheme(theme);
        editor.setValue(vnode.attrs.value || "");
      }
    }
  },
  onupdate(vnode){
      const overTypeToolbar = vnode.dom.querySelector(".overtype-toolbar");
      // hide the toolbar in preview mode
      if( vnode.attrs.preview ){
        overTypeToolbar.hidden = true;
      } else {
        overTypeToolbar.hidden = false;
      }
  },
  view(vnode) {
    return m(".inner-editor", {
      onclick: (e) => {
        !vnode.attrs.preview && e.stopPropagation();
      },
    });
  },
};
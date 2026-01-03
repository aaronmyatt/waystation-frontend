import OverType from "overtype";
import m from "mithril";

function overtypeOptions(vnode) {
  const customTheme = {
    name: "ws-flow-edit-theme",
    colors: {
      bgPrimary: 'var(--color-base-100)',
      bgSecondary: 'var(--color-base-200)',
      text: 'var(--color-base-content)',
      textPrimary: 'var(--color-base-content)',
      textSecondary: 'var(--color-neutral)',
      h1: 'var(--color-primary)',
      h2: 'var(--color-secondary)',
      h3: 'var(--color-accent)',
      strong: 'var(--color-primary)',
      em: 'var(--color-primary)',
      del: 'var(--color-error)',
      link: 'var(--color-info)',
      code: 'var(--color-neutral-content)',
      codeBg: 'var(--color-neutral)',
      blockquote: 'var(--color-base-content)',
      hr: 'var(--color-base-300)',
      syntaxMarker: 'var(--color-base-content)',
      syntax: 'var(--color-base-content)',
      cursor: 'var(--color-primary)',
      selection: 'oklch(from var(--color-accent) l c h / 0.4)',
      listMarker: 'var(--color-primary)',
      rawLine: 'var(--color-base-content)',
      border: 'var(--color-base-300)',
      hoverBg: 'var(--color-base-200)',
      primary: 'var(--color-primary)',
      // Toolbar colors
      toolbarBg: 'var(--color-base-100)',
      toolbarIcon: 'var(--color-base-content)',
      toolbarHover: 'var(--color-base-200)',
      toolbarActive: 'var(--color-base-300)',
    },
  };

  return {
    value: vnode.attrs.value || "",
    placeholder: vnode.attrs.placeholder || "",
    toolbar: vnode.attrs.toolbar || true,
    onChange: (value) => {
      vnode.attrs.onChange && vnode.attrs.onChange(value);
    },
    onKeydown: (event) => {
      vnode.attrs.onKeydown && vnode.attrs.onKeydown(event);
    },
    autoResize: true,
    padding: vnode.attrs.padding || "4px",
    minHeight: vnode.attrs.minHeight || "40px",
    fontFamily:
      vnode.attrs.fontFamily ||
      '"SF Mono", SFMono-Regular, Menlo, Monaco, "Cascadia Code", Consolas, "Roboto Mono", "Noto Sans Mono", "Droid Sans Mono", "Ubuntu Mono", "DejaVu Sans Mono", "Liberation Mono", "Courier New", Courier, monospace',
    fontSize: vnode.attrs.fontSize || "16px",
    lineHeight: vnode.attrs.lineHeight || "1.5",
    theme: customTheme,
  };
}

export const OvertypeBase = {
  editors: [],
  oncreate(vnode) {
    const options = overtypeOptions(vnode);
    vnode.state.editors = OverType.init(vnode.dom, options);
    // Initialize current value to prevent first onbeforeupdate from triggering setValue
    vnode.state.currentValue = vnode.attrs.value || "";

    const overTypePreview = vnode.dom.querySelector(".overtype-preview");
    // match the preview styles to the editor options to prevent visual collapse
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
    overTypePreview.style.setProperty(
      "padding",
      options.padding,
      "important"
    );
    overTypePreview.style.setProperty(
      "min-height",
      options.minHeight,
      "important"
    );

    // hitting escape should blur the editor
    vnode.dom.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        for (const editor of vnode.state.editors) {
          editor.blur();
        }
      }
    });
  },
  onremove(vnode) {
    vnode.dom.removeEventListener("keydown", () => {});
    for (const editor of vnode.state.editors) {
      editor.destroy();
    }
    vnode.state.editors = [];
  },
  onupdate(vnode) {
    const newValue = vnode.attrs.value || "";

    // Only update if value actually changed to prevent triggering onChange unnecessarily
    for (const editor of vnode.state.editors) {
      const currentValue = vnode.state.currentValue || "";
      const valueChanged = newValue !== currentValue;
      if (valueChanged) {
        editor.setValue(newValue);
        vnode.state.currentValue = newValue;
      }
    }
    // set toolbar tabindex to -1 to prevent tab focus
    const toolbar = vnode.dom.querySelector(".overtype-toolbar");
    if (toolbar) {
      toolbar.setAttribute("tabindex", "-1");
      // set toolbar buttons tabindex to -1 to prevent tab focus
      const buttons = toolbar.querySelectorAll("button");
      buttons.forEach((button) => {
        button.setAttribute("tabindex", "-1");
      });
    }
  },
  view(vnode) {
    return m(".inner-editor border border-base-300 focus-within:border-primary", {
    });
  },
};
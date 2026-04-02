import LinkProCard from "./cards/LinkProCard.jsx";

const TEMPLATE_COMPONENTS = {
  "link-pro-default": LinkProCard,
  "link-pro-classic": LinkProCard,
  "link-pro": LinkProCard,
};

const CATEGORY_FALLBACKS = {
  "link-pro": LinkProCard,
};

export default function CardRendererRegistry({
  templateId,
  categoryId,
  data = {},
  hiddenFields = [],
  customizations = {},
}) {
  const Renderer =
    TEMPLATE_COMPONENTS[templateId] ||
    CATEGORY_FALLBACKS[categoryId] ||
    null;

  if (!Renderer) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        Template renderer not registered for `{templateId || categoryId || "unknown"}`.
      </div>
    );
  }

  return (
    <Renderer
      data={data}
      hiddenFields={hiddenFields}
      customizations={customizations}
    />
  );
}

import { useMemo } from "react";
import { Plus, Trash2, ImageIcon } from "lucide-react";

const INPUT_TYPES = ["text", "email", "tel", "url", "number", "date"];

export default function TemplateFieldsForm({
  template,
  categoryId,
  data = {},
  onChange,
  onOpenMedia,
  disabled,
}) {
  const fields = useMemo(
    () => (template?.fields && Array.isArray(template.fields) ? template.fields : []),
    [template]
  );

  const handleChange = (fieldName, value) => {
    onChange({ ...data, [fieldName]: value });
  };

  const handleArrayItemChange = (fieldName, index, value) => {
    const arr = Array.isArray(data[fieldName]) ? [...data[fieldName]] : [];
    arr[index] = value;
    handleChange(fieldName, arr);
  };

  const addArrayItem = (fieldName) => {
    const arr = Array.isArray(data[fieldName]) ? [...data[fieldName]] : [];
    handleChange(fieldName, [...arr, ""]);
  };

  const removeArrayItem = (fieldName, index) => {
    const arr = Array.isArray(data[fieldName]) ? [...data[fieldName]] : [];
    handleChange(fieldName, arr.filter((_, i) => i !== index));
  };

  const renderField = (field) => {
    const { name, type, label, required, placeholder, options, multiple } = field;
    const value = data[name];

    if (type === "object" || (type === "text" && field.itemSchema)) return null;

    if (INPUT_TYPES.includes(type)) {
      return (
        <div key={name} className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          <input
            type={type}
            value={value ?? ""}
            onChange={(e) => handleChange(name, e.target.value)}
            placeholder={placeholder || label}
            disabled={disabled}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
          />
        </div>
      );
    }

    if (type === "textarea") {
      return (
        <div key={name} className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          <textarea
            value={value ?? ""}
            onChange={(e) => handleChange(name, e.target.value)}
            placeholder={placeholder || label}
            rows={3}
            disabled={disabled}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-400 resize-none"
          />
        </div>
      );
    }

    if (type === "checkbox") {
      return (
        <div key={name} className="flex items-center gap-2">
          <input
            type="checkbox"
            id={name}
            checked={!!value}
            onChange={(e) => handleChange(name, e.target.checked)}
            disabled={disabled}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor={name} className="text-sm font-medium text-slate-700">
            {label}
          </label>
        </div>
      );
    }

    if (type === "select") {
      const opts = options && Array.isArray(options) ? options : [];
      return (
        <div key={name} className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          <select
            value={value ?? ""}
            onChange={(e) => handleChange(name, e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-400"
          >
            <option value="">Select {label}</option>
            {opts.map((opt) => (
              <option key={opt.value ?? opt} value={opt.value ?? opt}>
                {opt.label ?? opt.value ?? opt}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (type === "image") {
      if (multiple) {
        const urls = Array.isArray(value) ? value : value ? [value] : [];
        return (
          <div key={name} className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              {label}
              {required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <div className="flex flex-wrap gap-2">
              {urls.map((url, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={url}
                    alt=""
                    className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem(name, idx)}
                    disabled={disabled}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 text-xs"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => onOpenMedia(name, "image", true)}
                disabled={disabled}
                className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-600"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>
        );
      }
      return (
        <div key={name} className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          <div className="flex items-center gap-3">
            {value ? (
              <img
                src={value}
                alt=""
                className="w-16 h-16 object-cover rounded-lg border border-slate-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-slate-400" />
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onOpenMedia(name, "image", false)}
                disabled={disabled}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-sm font-medium"
              >
                {value ? "Change" : "Select image"}
              </button>
              {value && (
                <button
                  type="button"
                  onClick={() => handleChange(name, "")}
                  disabled={disabled}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-sm"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  if (fields.length === 0) {
    return (
      <p className="text-sm text-slate-500 py-4">
        No form fields defined for this template. You can still set a card name and save.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {fields.map((field) => renderField(field))}
    </div>
  );
}

'use client';

function optionValue(opt) {
  return typeof opt === 'object' && opt !== null ? opt.value : opt;
}

function optionLabel(opt) {
  return typeof opt === 'object' && opt !== null ? opt.label ?? opt.value : opt;
}

export default function SalaryFieldInput({ field, value, error, hint, onChange }) {
  const readOnly = field.isEditable === false;
  const options = field.options || [];

  const label = (
    <label className="fl">
      {field.name}
      {field.isRequired ? <span style={{ color: 'var(--red)' }}> *</span> : null}
    </label>
  );

  let control;
  switch (field.inputType) {
    case 'textarea':
      control = (
        <textarea
          className="fi"
          placeholder={field.placeholder}
          value={value ?? ''}
          disabled={readOnly}
          onChange={(e) => onChange(e.target.value)}
        />
      );
      break;

    case 'number':
    case 'decimal':
    case 'percentage':
      control = (
        <input
          className="fi"
          type="number"
          step={field.inputType === 'number' ? '1' : '0.01'}
          placeholder={field.placeholder}
          value={value ?? ''}
          disabled={readOnly}
          onChange={(e) => onChange(e.target.value)}
        />
      );
      break;

    case 'currency':
      control = (
        <div className="dsf-currency">
          <span className="dsf-currency-sym">₹</span>
          <input
            className="fi"
            type="number"
            step="0.01"
            placeholder={field.placeholder}
            value={value ?? ''}
            disabled={readOnly}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );
      break;

    case 'select':
      control = (
        <select className="fi" value={value ?? ''} disabled={readOnly} onChange={(e) => onChange(e.target.value)}>
          <option value="">{field.placeholder || 'Select…'}</option>
          {options.map((opt) => (
            <option key={optionValue(opt)} value={optionValue(opt)}>
              {optionLabel(opt)}
            </option>
          ))}
        </select>
      );
      break;

    case 'multiselect': {
      const selected = Array.isArray(value) ? value : [];
      control = (
        <div className="dsf-options">
          {options.map((opt) => {
            const ov = optionValue(opt);
            const checked = selected.includes(ov);
            return (
              <label key={ov} className="dsf-opt">
                <input
                  type="checkbox"
                  className="gen-check"
                  checked={checked}
                  disabled={readOnly}
                  onChange={(e) => {
                    const next = e.target.checked ? [...selected, ov] : selected.filter((v) => v !== ov);
                    onChange(next);
                  }}
                />
                {optionLabel(opt)}
              </label>
            );
          })}
        </div>
      );
      break;
    }

    case 'boolean':
      control = (
        <label className="tog">
          <input type="checkbox" checked={Boolean(value)} disabled={readOnly} onChange={(e) => onChange(e.target.checked)} />
          <span className="tog-sl" />
        </label>
      );
      break;

    case 'checkbox':
      control = (
        <input
          type="checkbox"
          className="gen-check"
          checked={Boolean(value)}
          disabled={readOnly}
          onChange={(e) => onChange(e.target.checked)}
        />
      );
      break;

    case 'radio':
      control = (
        <div className="dsf-options">
          {options.map((opt) => {
            const ov = optionValue(opt);
            return (
              <label key={ov} className="dsf-opt">
                <input
                  type="radio"
                  name={field.id}
                  checked={value === ov}
                  disabled={readOnly}
                  onChange={() => onChange(ov)}
                />
                {optionLabel(opt)}
              </label>
            );
          })}
        </div>
      );
      break;

    case 'date':
      control = (
        <input className="fi" type="date" value={value ?? ''} disabled={readOnly} onChange={(e) => onChange(e.target.value)} />
      );
      break;

    case 'text':
    default:
      control = (
        <input
          className="fi"
          type="text"
          placeholder={field.placeholder}
          value={value ?? ''}
          disabled={readOnly}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }

  return (
    <div className="ff">
      {label}
      {control}
      {field.description ? <div className="dsf-desc">{field.description}</div> : null}
      {hint ? <div className="dsf-hint">{hint}</div> : null}
      <div className="ferr">{error}</div>
    </div>
  );
}

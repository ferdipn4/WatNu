/* @ds-bundle: {"format":4,"namespace":"WatNu","components":[{"name":"Button"},{"name":"Chip"},{"name":"Card"},{"name":"EventCard"},{"name":"OrganizerCard"},{"name":"WarningPanel"},{"name":"TabBar"},{"name":"Field"},{"name":"OrgLogo"},{"name":"Icon"},{"name":"Toast"}]} */
(function () {
  var React = window.React;
  var h = React.createElement;

  function cx() {
    var out = [];
    for (var i = 0; i < arguments.length; i++) if (arguments[i]) out.push(arguments[i]);
    return out.join(' ');
  }

  /* ---------- Icon: 24px grid, 1.75 stroke, round caps (the same spec as lucide-react) ---------- */
  var ICONS = {
    home: ['M3 10.5 12 3l9 7.5', 'M5 9.5V21h14V9.5', 'M10 21v-6h4v6'],
    users: ['M9 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z', 'M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6', 'M16 4.6a3.5 3.5 0 0 1 0 6.8', 'M17.5 14c2.6.5 4 2.6 4 6'],
    plus: ['M12 5v14', 'M5 12h14'],
    bookmark: ['M6 4h12v17l-6-4-6 4z'],
    clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 7v5l3 2'],
    pin: ['M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z', 'M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'],
    calendar: ['M3 8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z', 'M3 10h18', 'M8 3v4', 'M16 3v4'],
    'chevron-right': ['m9 6 6 6-6 6'],
    'chevron-down': ['m6 9 6 6 6-6'],
    'arrow-left': ['M19 12H5', 'm12 5-7 7 7 7'],
    search: ['M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z', 'm20 20-3.5-3.5'],
    share: ['M12 3v12', 'm7 8 5-5 5 5', 'M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5'],
    warning: ['M12 3 2.5 20h19L12 3z', 'M12 9.5v4.5', 'M12 17.2v.3'],
    copy: ['M9 9h11v11H9z', 'M5 15V6a2 2 0 0 1 2-2h9'],
    bulb: ['M9 18h6', 'M10 21h4', 'M8.5 14.5A6 6 0 1 1 15.5 14.5c-.7.7-1 1.5-1 2.5h-5c0-1-.3-1.8-1-2.5z'],
    check: ['m5 12 5 5 9-10'],
    upload: ['M12 16V4', 'm7 9 5-5 5 5', 'M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3'],
    image: ['M3 8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z', 'M8.5 11.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z', 'm21 16-5-5-8 8'],
    at: ['M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.5 7.1'],
    text: ['M4 6h16', 'M4 12h16', 'M4 18h10'],
    scan: ['M4 8V5a1 1 0 0 1 1-1h3', 'M16 4h3a1 1 0 0 1 1 1v3', 'M20 16v3a1 1 0 0 1-1 1h-3', 'M8 20H5a1 1 0 0 1-1-1v-3', 'M4 12h16'],
    ticket: ['M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z', 'M10 6v2', 'M10 11v2', 'M10 16v2'],
    qr: ['M4 4h6v6H4z', 'M14 4h6v6h-6z', 'M4 14h6v6H4z', 'M14 14h2v2h-2z', 'M18 14h2v2h-2z', 'M14 18h2v2h-2z', 'M18 18h2v2h-2z'],
    'trend-up': ['m3 17 6-6 4 4 8-8', 'M15 7h6v6'],
    translate: ['M4 5h9', 'M8.5 3v2c0 4-2.5 7.5-5.5 9', 'M6 9c1 2.5 3.5 4.5 6 5.5', 'm14 21 4-9 4 9', 'M15.5 17.5h5'],
    x: ['M6 6l12 12', 'M18 6 6 18'],
    euro: ['M17 6.5A6.5 6.5 0 0 0 6.5 12 6.5 6.5 0 0 0 17 17.5', 'M4 10.5h9', 'M4 13.5h9'],
    star: ['M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z'],
    spinner: ['M12 3a9 9 0 0 1 9 9', 'M21 12a9 9 0 0 1-9 9']
  };

  function Icon(props) {
    var paths = ICONS[props.name] || ICONS.star;
    var filled = props.name === 'star' || props.filled;
    var size = props.size;
    var cls = cx('wn-icon', size === 16 && 'wn-icon-16', size === 24 && 'wn-icon-24', size === 28 && 'wn-icon-28', props.className);
    var children = [];
    for (var i = 0; i < paths.length; i++) children.push(h('path', { key: i, d: paths[i] }));
    return h('svg', {
      className: cls, viewBox: '0 0 24 24', width: size || 20, height: size || 20,
      fill: filled ? 'currentColor' : 'none', stroke: filled ? 'none' : 'currentColor',
      strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round',
      'aria-hidden': props.title ? undefined : 'true', role: props.title ? 'img' : undefined,
      style: props.style
    }, props.title ? [h('title', { key: 't' }, props.title)].concat(children) : children);
  }

  /* ---------- Button ---------- */
  function Button(props) {
    var variant = props.variant || 'primary';
    var size = props.size || 'md';
    var Tag = props.href ? 'a' : 'button';
    var rest = {};
    for (var k in props) if (['variant', 'size', 'full', 'icon', 'iconOnly', 'round', 'onImage', 'soon', 'onSoon', 'className', 'children'].indexOf(k) < 0) rest[k] = props[k];
    if (Tag === 'button' && !rest.type) rest.type = 'button';
    if (props.soon) { variant = 'soon'; rest['aria-disabled'] = 'true'; rest.onClick = props.onSoon || props.onClick; }
    rest.className = cx('wn-btn', 'wn-btn-' + variant, size !== 'md' && 'wn-btn-' + size, props.full && 'wn-btn-full', props.iconOnly && 'wn-btn-icon', props.round && 'wn-btn-round', props.onImage && 'wn-btn-on-image', props.className);
    var icon = typeof props.icon === 'string' ? h(Icon, { name: props.icon }) : props.icon;
    var soonTag = props.soon ? h('span', { className: 'wn-tag wn-tag-soon' }, 'Soon') : null;
    return h(Tag, rest, icon, props.iconOnly ? null : props.children, soonTag);
  }

  /* ---------- Chip: a filter (md, tappable) or a tag (sm, static) ---------- */
  function Chip(props) {
    var icon = typeof props.icon === 'string' ? h(Icon, { name: props.icon, size: props.size === 'sm' ? 14 : 16 }) : props.icon;
    if (props.size === 'sm') {
      if (props.tone === 'soon' && !props.icon) icon = h(Icon, { name: 'clock', size: 14 });
      return h('span', { className: cx('wn-tag', props.tone && props.tone !== 'neutral' && 'wn-tag-' + props.tone, props.className) }, icon, props.label || props.children);
    }
    return h('button', {
      type: 'button', className: cx('wn-chip', props.selected && 'wn-chip-selected', props.className),
      'aria-pressed': props.selected ? 'true' : 'false', onClick: props.onClick
    }, icon, props.label || props.children);
  }

  /* ---------- Card ---------- */
  function Card(props) {
    var Tag = props.as || (props.onClick ? 'button' : 'div');
    var rest = {};
    for (var k in props) if (['as', 'tone', 'tight', 'className', 'children'].indexOf(k) < 0) rest[k] = props[k];
    if (Tag === 'button') rest.type = 'button';
    rest.className = cx('wn-card', props.tone && props.tone !== 'raised' && 'wn-card-' + props.tone, props.tight && 'wn-card-tight', props.className);
    return h(Tag, rest, props.children);
  }

  /* ---------- OrgLogo: the organizer's logo, or a monogram tile by type ---------- */
  function OrgLogo(props) {
    var type = (props.type || 'association').toLowerCase().replace('é', 'e');
    var initials = props.initials || (props.name || '?').split(/\s+/).map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
    return h('span', {
      className: cx('wn-logo', 'wn-logo-' + type, props.size && props.size !== 'md' && 'wn-logo-' + props.size, props.round && 'wn-logo-round', props.className),
      'aria-label': props.name, role: 'img'
    }, props.src ? h('img', { src: props.src, alt: '' }) : initials);
  }

  /* ---------- EventCard ---------- */
  function EventCard(props) {
    var free = props.price == null || props.price === 0 || props.price === 'Free';
    var tags = [h(Chip, { key: 'c', size: 'sm', label: props.category })];
    if (props.newcomers) tags.push(h(Chip, { key: 'n', size: 'sm', tone: 'maas', label: 'Newcomers welcome' }));
    var meta = props.location === props.organizer ? props.location : [props.location, props.organizer].filter(Boolean).join(' · ');
    var onSave = props.onSave;
    var image = props.image ? h('div', { className: 'wn-event-image' }, typeof props.image === 'string' ? h('img', { src: props.image, alt: '' }) : props.image) : null;
    return h(Card, { as: props.onClick ? 'button' : 'article', tight: true, className: cx('wn-event', image && 'wn-event-with-image', props.className), onClick: props.onClick },
      image,
      h('div', { className: 'wn-event-row' },
      h('div', { className: 'wn-event-time' },
        h('span', { className: 'wn-time' }, props.time),
        props.endTime ? h('span', { className: 'wn-caption' }, '–' + props.endTime) : null
      ),
      h('div', { className: 'wn-event-main' },
        h('div', { className: 'wn-event-title' }, props.title),
        h('div', { className: 'wn-event-meta' }, meta),
        h('div', { className: 'wn-event-tags' }, tags)
      ),
      h('div', { className: 'wn-event-side' },
        free ? h(Chip, { size: 'sm', tone: 'maas', label: 'Free' }) : h('span', { className: 'wn-event-price' }, typeof props.price === 'number' ? '€' + props.price : props.price),
        props.onSave !== null ? h('span', {
          className: cx('wn-event-save', props.saved && 'wn-on'), role: 'button', tabIndex: 0,
          'aria-label': props.saved ? 'Saved' : 'Save', 'aria-pressed': props.saved ? 'true' : 'false',
          onClick: function (e) { e.stopPropagation(); if (onSave) onSave(!props.saved); }
        }, h(Icon, { name: 'bookmark', filled: !!props.saved })) : null
      )
      )
    );
  }

  /* ---------- OrganizerCard ---------- */
  function OrganizerCard(props) {
    var typeLabel = { association: 'Student association', cafe: 'Café', club: 'Club', venue: 'Venue' }[(props.type || 'association').toLowerCase().replace('é', 'e')] || props.type;
    var onFollow = props.onFollow;
    return h(Card, { as: props.onClick ? 'button' : 'div', tight: true, className: cx('wn-org', props.className), onClick: props.onClick },
      h(OrgLogo, { name: props.name, initials: props.initials, type: props.type, src: props.logo }),
      h('div', { className: 'wn-org-main' },
        h('div', { className: 'wn-org-name' }, props.name),
        h('div', { className: 'wn-org-meta' }, typeLabel + ' · ' + props.category)
      ),
      props.onFollow === null ? h(Icon, { name: 'chevron-right', className: 'wn-org-chevron' })
        : h(Button, {
          size: 'sm', variant: props.following ? 'secondary' : 'primary', icon: props.following ? 'check' : undefined,
          'aria-pressed': props.following ? 'true' : 'false',
          onClick: function (e) { e.stopPropagation(); if (onFollow) onFollow(!props.following); }
        }, props.following ? 'Following' : 'Follow')
    );
  }

  /* ---------- WarningPanel ---------- */
  var PANEL = {
    conflict: { icon: 'warning', kicker: 'Busy slot' },
    duplicate: { icon: 'copy', kicker: 'Possible duplicate' },
    suggestion: { icon: 'bulb', kicker: 'Suggestion' },
    soon: { icon: 'clock', kicker: 'Coming soon' }
  };
  function WarningPanel(props) {
    var tone = props.tone || 'conflict';
    var spec = PANEL[tone] || PANEL.conflict;
    return h('section', { className: cx('wn-panel', 'wn-panel-' + tone, props.className), role: (tone === 'suggestion' || tone === 'soon') ? undefined : 'alert' },
      h('span', { className: 'wn-panel-icon' }, h(Icon, { name: props.icon || spec.icon })),
      h('div', { className: 'wn-panel-main' },
        h('span', { className: 'wn-panel-kicker' }, props.kicker || spec.kicker),
        h('span', { className: 'wn-panel-title' }, props.title),
        props.children ? h('span', { className: 'wn-panel-body' }, props.children) : null,
        props.actions ? h('div', { className: 'wn-panel-actions' }, props.actions) : null
      )
    );
  }

  /* ---------- TabBar: This week · Organizers · (+) · My WatNu ---------- */
  var TABS = [
    { id: 'week', label: 'This week', icon: 'home' },
    { id: 'organizers', label: 'Organizers', icon: 'users' },
    { id: 'create', label: 'Create', icon: 'plus' },
    { id: 'mine', label: 'My WatNu', icon: 'bookmark' }
  ];
  function TabBar(props) {
    var onChange = props.onChange;
    return h('nav', { className: cx('wn-tabbar', props.className), 'aria-label': 'Main' },
      TABS.map(function (t) {
        var on = props.active === t.id;
        if (t.id === 'create') {
          return h('button', { key: t.id, type: 'button', className: 'wn-tab wn-tab-create', 'aria-label': 'Create event', onClick: function () { if (onChange) onChange(t.id); } },
            h('span', { className: 'wn-fab' }, h(Icon, { name: 'plus', size: 28 })),
            h('span', { className: 'wn-tab-label' }, 'Create')
          );
        }
        return h('button', { key: t.id, type: 'button', className: cx('wn-tab', on && 'wn-tab-on'), 'aria-current': on ? 'page' : undefined, onClick: function () { if (onChange) onChange(t.id); } },
          h(Icon, { name: t.icon, size: 24, filled: on && t.icon === 'bookmark' }),
          h('span', null, t.label)
        );
      })
    );
  }

  /* ---------- Field: text · textarea · select · search · switch ---------- */
  function Field(props) {
    var kind = props.kind || 'text';
    var onChange = props.onChange;
    var hint = props.hint || (props.missing ? 'Not on the poster — please add it' : null);
    var hintEl = hint ? h('span', { className: 'wn-field-hint' }, props.missing ? h(Icon, { name: 'warning', size: 14 }) : null, hint) : null;
    var labelEl = props.label ? h('label', { className: 'wn-field-label', htmlFor: props.id }, h('span', null, props.label), props.trailing ? h('span', null, props.trailing) : null) : null;

    if (kind === 'switch') {
      return h('div', { className: cx('wn-field', props.className) },
        h('div', { className: 'wn-field-row' },
          h('span', { className: 'wn-field-label' }, h('span', null, props.label)),
          h('button', { type: 'button', role: 'switch', className: 'wn-switch', 'aria-checked': props.checked ? 'true' : 'false', 'aria-label': props.label, onClick: function () { if (onChange) onChange(!props.checked); } })
        ), hintEl);
    }
    var control;
    if (kind === 'textarea') {
      control = h('textarea', { id: props.id, className: 'wn-input', placeholder: props.placeholder, value: props.value == null ? '' : props.value, readOnly: !onChange, onChange: onChange ? function (e) { onChange(e.target.value); } : undefined });
    } else if (kind === 'select') {
      control = h('button', { type: 'button', id: props.id, className: 'wn-input wn-input-select', onClick: props.onOpen }, h('span', null, props.value || props.placeholder), h(Icon, { name: 'chevron-down' }));
    } else if (kind === 'search') {
      control = h('div', { className: 'wn-input wn-input-search' }, h(Icon, { name: 'search' }), h('input', { id: props.id, type: 'search', placeholder: props.placeholder, value: props.value == null ? '' : props.value, readOnly: !onChange, onChange: onChange ? function (e) { onChange(e.target.value); } : undefined, 'aria-label': props.label || props.placeholder }));
    } else {
      control = h('input', { id: props.id, type: props.type || 'text', className: 'wn-input', placeholder: props.placeholder, value: props.value == null ? '' : props.value, readOnly: !onChange, onChange: onChange ? function (e) { onChange(e.target.value); } : undefined, inputMode: props.inputMode });
    }
    return h('div', { className: cx('wn-field', props.missing && 'wn-field-missing', props.className) }, labelEl, control, hintEl);
  }

  /* ---------- Toast: one line at the bottom, 4 seconds; maas for done, neutral for info ---------- */
  function Toast(props) {
    var tone = props.tone || 'info';
    return h('div', { className: cx('wn-toast', 'wn-toast-' + tone, props.className), role: 'status' },
      h(Icon, { name: props.icon || (tone === 'done' ? 'check' : 'clock') }),
      h('span', null, props.children),
      props.action ? h('button', { type: 'button', className: 'wn-toast-action', onClick: props.onAction }, props.action) : null
    );
  }

  var api = { Toast: Toast, Button: Button, Chip: Chip, Card: Card, EventCard: EventCard, OrganizerCard: OrganizerCard, WarningPanel: WarningPanel, TabBar: TabBar, Field: Field, OrgLogo: OrgLogo, Icon: Icon, icons: Object.keys(ICONS) };
  window.WatNu = window.WatNu || {};
  for (var k in api) window.WatNu[k] = api[k];
})();

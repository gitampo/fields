export const theme = {
  // ─── Colori ──────────────────────────────────────────────────────────────
  colors: {
    primary:       '#11449b',
    primaryLight:  '#EAF4FF',
    secondary:     '#2E7D32',
    accent:        '#F57C00',
    background:    '#EAF3FF',
    surface:       '#FFFFFF',
    text:          '#6f0d0dd2',
    secondaryText: '#5C6F82',
    border:        '#D6DFE6',
    success:       '#2E7D32',
    error:         '#D93025',
  },

  // ─── Spaziatura ──────────────────────────────────────────────────────────
  spacing: {
    xs:  4,
    sm:  8,
    md:  16,
    lg:  24,
    xl:  32,
  },

  // ─── Border radius ───────────────────────────────────────────────────────
  borderRadius: {
    sm:   8,
    md:   10,
    lg:   14,
    full: 999,
  },

  // ─── Tipografia ──────────────────────────────────────────────────────────
  fontSize: {
    xs:   11,
    sm:   13,
    md:   15,
    lg:   18,
    xl:   24,
    xxl:  28,
  },
  fontWeight: {
    regular: '400' as const,
    medium:  '500' as const,
    semibold:'600' as const,
    bold:    '700' as const,
  },

  // ─── Ombre ───────────────────────────────────────────────────────────────
  shadow: {
    color:   '#000000',
    opacity: 0.07,
    offset:  { width: 0, height: 2 },
    radius:  8,
    elevation: 2,
  },
};

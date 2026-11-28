# @ascentui/pro

The Pro components: Data Grid, Chart, Month Grid, Command Menu, Stepper Form, Upload, Bottom Sheet
and Pull to Refresh. Proprietary, see `LICENSE`.

- One file per component, styles inside, like the free kit. They import free pieces as
  `@ascentui/ui/components/<name>`; the registry build rewrites those to `./<name>` for installs.
- Never published to npm and never written into `site/public/`. `scripts/build-registry.mjs` writes the
  Pro registry items to `.build/registry-pro/`, for the gated registry to serve to licence holders.
- A free component must never import a Pro one.

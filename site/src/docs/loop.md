# The loop

Most business software is the same loop repeated: **sign in, see a list, open a record, change it, get told it worked.** An agent that has that loop, done properly once, can build most of an app by repeating it. So the catalog leads with the loop, not with variety.

## The seven things that cover most of the work

| # | What | Why an agent needs it handed over |
| --- | --- | --- |
| 1 | **Shell**: sidebar and top bar on a desk, tab bar on a phone | Every screen sits in one. Agents rebuild it differently on every page |
| 2 | **Sign in and roles** | Needed by every app, and easy to get subtly wrong |
| 3 | **List**: table on a desk, rows on a phone, with search, filter, sort and paging | The most common screen in business software |
| 4 | **Record**: a drawer or page showing one thing, with its history | The second most common |
| 5 | **Form**: fields, validation, save, error | Where most bugs live |
| 6 | **States**: loading, empty, error, saved, confirm, undo | What separates a demo from a working app. Agents skip these unless told |
| 7 | **One way to talk to data**: the contract and mock client | Without it every screen invents its own, and nothing agrees |

## The four things that make the rest work

| What | Why |
| --- | --- |
| **Theme** | One place to change the look, so screens stay consistent |
| **Conventions guide** | A short file the agent reads first |
| **Phone behaviour** | Bottom sheets, big touch targets, pull to refresh, the tab bar. A desktop layout squeezed onto a phone is not a mobile app |
| **Checks** | Tests the agent runs on its own work, so "it compiles" is not where it stops |

## Where each step lives in the catalog

| Step | Free parts | Pro screens and blocks |
| --- | --- | --- |
| Sign in | Sign in screen, PIN Input, Text Field | Sign up, reset password, accept invite, verify code, PIN sign-in |
| List | Data Table, List Row, Filter bar, Pull to Refresh | Record list page, Phone list, Bulk action bar |
| Record | Dialog + Drawer, Bottom Sheet | Record drawer, Phone record, Timeline |
| Form | Form kit, the form components, Stepper Form | Settings form, Settings, Profile and account |
| States | Skeleton + Spinner, Empty State, Toaster | History and undo, Undo history panel, Trash and archive |

Most of these are planned. The [library](#library) shows what is built today.

## The order things ship

1. **Core.** The theme, the components, the agent kit. All free.
2. **The working loop.** Sign in, list, record, form and states as working screens, on desk and phone. Pro launches here.
3. **Business screens.** Dispatch, field app, CRM, quotes and payments, assets and warranty.
4. **Secondary.** Illustration, standalone motion, Brand Studio, an AI activity screen.
5. **Deployable app.** A reference server and two starter apps.

Everyone who buys Pro gets the later phases at no extra cost.

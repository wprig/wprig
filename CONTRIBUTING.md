# Contributing
WP Rig is an open source project built by the WordPress community for the WordPress community. Contributors and contributions welcome.
If you have found a problem or want to suggest an improvement or new feature, please file an issue being careful to follow the provided template.
If you want to contribute code to WP Rig, please follow the instructions below:

## Office Hours
WP Rig office hours take place every other Thursday from 5:30 - 6:30 p.m. UTC, starting January 10, 2019.

Join WP Rig core maintainers to chat about the project, work alongside other devs, discuss ideas, address bugs, and more.

- [View the WP Rig Google Calendar](https://calendar.google.com/calendar/embed?src=wprigio%40gmail.com&ctz=America%2FChicago) to see dates and find info to join the discussion
- [Subscribe to the WP Rig Google Calendar](https://calendar.google.com/calendar?cid=d3ByaWdpb0BnbWFpbC5jb20) to stay informed.

## Workflow
1. Set up a local development environment with a WordPress site running on your computer.
2. Fork the WP Rig repository.
3. Clone the forked repository to your computer.
4. Create a new branch for your changes.
5. Run WP Rig as you normally would.
6. Make code changes as necessary.
7. Commit changes within the new branch.
9. Push the new branch to your forked repository.
10. Submit a Pull Request to the WP Rig repository explaining your changes and referencing any related issues.

## Guidelines for pull requests
- Keep pull requests as concise as possible. If you're addressing a bug, only submit the fixes for that bug. 
  - Submit unrelated cleanup, e.g. fixing spaces, tabs, or any violations caught by PHPCS, as its own pull request.

## Branch naming convention
Name your branches with prefixes and descriptions: `[type]/[change]`. Examples:

- `add/` = add a new feature
- `try/` = experimental feature, "tentatively add"
- `update/` = update an existing feature

## Localizing WP Rig
WP Rig is a boilerplate for creating WordPress themes. The likelihood of a theme developer changing the structure of PHP files is high and any translation files shipped with WP Rig would be invalidated. For this reason, translations of WP Rig will not be accepted.

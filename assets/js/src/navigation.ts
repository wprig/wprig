declare const wpRigScreenReaderText: { [key: string]: string };

// Initiate the menus when the DOM loads.
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initNavigation);
} else {
	initNavigation();
}

function initNavigation(): void {
	initNavToggleSubmenus();
	initNavToggleSmall();
	setMenuHeight();
	watchForWindowSizeChanges();
}

function initNavToggleSubmenus(): void {
	const navTOGGLE: NodeListOf<HTMLElement> = document.querySelectorAll('.nav--toggle-sub');

	if (!navTOGGLE.length) {
		return;
	}

	navTOGGLE.forEach(nav => initEachNavToggleSubmenu(nav));
}

function initEachNavToggleSubmenu(nav: HTMLElement): void {
	const SUBMENUS: NodeListOf<HTMLElement> = nav.querySelectorAll('ul.sub-menu, ul.wp-block-navigation__submenu-container');

	if (!SUBMENUS.length) {
		return;
	}

	const dropdownButton = getDropdownButton();

	SUBMENUS.forEach((submenu, index) => processEachSubMenu(SUBMENUS, dropdownButton, index));
}

function handleToggleSubMenuEvents(parentMenuItem: ParentNode): void {
	const FOCUS_ELEMENTS_SELECTOR = 'ul.toggle-show > li > a, ul.toggle-show > li > button';
	const anchor = parentMenuItem.querySelector<HTMLAnchorElement>('a');
	anchor?.addEventListener('focus', (e) => {
		const parentMenuItemsToggled: NodeListOf<HTMLElement> = e.currentTarget.parentNode!.parentNode.querySelectorAll(
			'li.menu-item--toggled-on'
		);
		parentMenuItemsToggled.forEach(menuItem => toggleSubMenu(menuItem, false));
	});

	parentMenuItem.addEventListener('keydown', (e) => {
		if (e instanceof KeyboardEvent && e.key === 'Tab' && shouldToggleSubMenu(e, FOCUS_ELEMENTS_SELECTOR)) {
			const parentNode = (e.target as HTMLElement).parentNode as HTMLElement;
			toggleSubMenu(parentNode, false);
		}
	});
}

function shouldToggleSubMenu(e: KeyboardEvent, focusSelector: string): boolean {
	const container = e.shiftKey ? isFirstFocusableElement : isLastFocusableElement;
	return container(document, e.target as HTMLElement, focusSelector);
}

function initNavToggleSmall(): void {
	const navTOGGLE: NodeListOf<HTMLElement> = document.querySelectorAll('.nav--toggle-small');

	if (!navTOGGLE.length) {
		return;
	}

	navTOGGLE.forEach(nav => initEachNavToggleSmall(nav));
}

function setMenuHeight(): void {
	if (window.outerWidth <= 800) {
		const docHeight = document.body.scrollHeight;
		const menuElement = document.querySelector<HTMLElement>('.primary-menu-container');
		if (menuElement) {
			menuElement.style.height = `${docHeight}px`;
		}
	}
}

function watchForWindowSizeChanges(): void {
	window.addEventListener('resize', () => {
		const width = window.innerWidth;
		const mobileBreakPoint = 55;
		const emValue = width / parseFloat(getComputedStyle(document.documentElement).fontSize);
		if (emValue > mobileBreakPoint) {
			closeAllSubMenus();
		}
	});
}

function processEachSubMenu(SUBMENUS: NodeListOf<HTMLElement>, dropdownButton: HTMLElement, index: number): void {
	const parentMenuItem = SUBMENUS[index].parentNode as HTMLElement;
	const isNavigationBlock = parentMenuItem.classList.contains('wp-block-navigation-item');
	let dropdown = parentMenuItem.querySelector<HTMLElement>('.dropdown');

	if (!dropdown && !isNavigationBlock) {
		dropdown = createDropdown(parentMenuItem, SUBMENUS, index);
		parentMenuItem.insertBefore(dropdown, SUBMENUS[index]);
	}

	if (!isNavigationBlock) {
		convertDropdownToToggleButton(dropdown!, dropdownButton);
	} else {
		parentMenuItem.querySelector<HTMLElement>('.wp-block-navigation-submenu__toggle')?.addEventListener('click', (e) => {
			const parentNode = (e.currentTarget as HTMLElement).parentNode as HTMLElement;
			toggleSubMenu(parentNode);
		});
	}

	const subMenuParentLink = parentMenuItem.querySelector<HTMLAnchorElement>(':scope > a');
	if (subMenuParentLink && subMenuParentLink.getAttribute('href') === '#') {
		subMenuParentLink.addEventListener('click', (e) => {
			e.preventDefault();
			const parentNode = (e.currentTarget as HTMLElement).parentNode as HTMLElement;
			toggleSubMenu(parentNode);
		});
	}

	handleToggleSubMenuEvents(parentMenuItem);
	parentMenuItem.classList.add('menu-item--has-toggle');
}

function createDropdown(parentMenuItem: ParentNode, SUBMENUS: NodeListOf<HTMLElement>, index: number): HTMLElement {
	const dropdown = document.createElement('span');
	dropdown.classList.add('dropdown');
	const dropdownSymbol = document.createElement('i');
	dropdownSymbol.classList.add('dropdown-symbol');
	dropdown.appendChild(dropdownSymbol);
	parentMenuItem.insertBefore(dropdown, SUBMENUS[index]);
	return dropdown;
}

function convertDropdownToToggleButton(dropdown: HTMLElement, dropdownButton: HTMLElement): void {
	const thisDropdownButton = dropdownButton.cloneNode(true) as HTMLElement;
	thisDropdownButton.innerHTML = dropdown.innerHTML;
	dropdown.parentNode!.replaceChild(thisDropdownButton, dropdown);
	thisDropdownButton.addEventListener('click', (e) => {
		const parentNode = (e.currentTarget as HTMLElement).parentNode as HTMLElement;
		toggleSubMenu(parentNode);
	});
}

function initEachNavToggleSmall(nav: HTMLElement): void {
	const menuTOGGLE = nav.querySelector<HTMLElement>('.menu-toggle');

	if (!menuTOGGLE) {
		return;
	}

	menuTOGGLE.setAttribute('aria-expanded', 'false');

	menuTOGGLE.addEventListener('click', (e) => {
		nav.classList.toggle('nav--toggled-on');
		const target = e.target as HTMLElement;
		target.setAttribute('aria-expanded', target.getAttribute('aria-expanded') === 'false' ? 'true' : 'false');
	}, false);
}

function toggleSubMenu(parentMenuItem: HTMLElement, limitOpenSubmenus = false): void {
	const toggleButton = parentMenuItem.querySelector<HTMLElement>('.dropdown-toggle, .wp-block-navigation-submenu__toggle'),
		subMenu = parentMenuItem.querySelector<HTMLElement>('ul');
	const parentMenuItemToggled = parentMenuItem.classList.contains('menu-item--toggled-on');

	if (!toggleButton.classList.contains('wp-block-navigation-submenu__toggle')) {
		toggleButton.setAttribute('aria-expanded', (!parentMenuItemToggled).toString());
	}

	if (parentMenuItemToggled) {
		parentMenuItem.classList.remove('menu-item--toggled-on');
		subMenu!.classList.remove('toggle-show');
		toggleButton.setAttribute('aria-label', wpRigScreenReaderText.collapse);

		if (limitOpenSubmenus) {
			const subMenuItemsToggled = parentMenuItem.querySelectorAll<HTMLElement>('.menu-item--toggled-on');
			subMenuItemsToggled.forEach(menuItem => toggleSubMenu(menuItem));
		}
	} else {
		if (limitOpenSubmenus) {
			const parentMenuItemsToggled = parentMenuItem.parentNode!.querySelectorAll<HTMLElement>('li.menu-item--toggled-on');
			parentMenuItemsToggled.forEach(menuItem => toggleSubMenu(menuItem));
		}

		parentMenuItem.classList.add('menu-item--toggled-on');
		subMenu!.classList.add('toggle-show');
		toggleButton.setAttribute('aria-label', wpRigScreenReaderText.expand);
	}
}

function closeAllSubMenus(): void {
	const toggledMenuItems = document.querySelectorAll<HTMLElement>('.menu-item--toggled-on');
	toggledMenuItems.forEach(menuItem => toggleSubMenu(menuItem));
}

function getDropdownButton(): HTMLElement {
	const dropdownButton = document.createElement('button');
	dropdownButton.classList.add('dropdown-toggle');
	dropdownButton.setAttribute('aria-expanded', 'false');
	dropdownButton.setAttribute('aria-label', wpRigScreenReaderText.expand);
	return dropdownButton;
}

function isFirstFocusableElement(container: HTMLElement, element: HTMLElement, focusSelector: string): boolean {
	const focusableElements = container.querySelectorAll<HTMLElement>(focusSelector);
	return focusableElements.length > 0 && element === focusableElements[0];
}

function isLastFocusableElement(container: HTMLElement, element: HTMLElement, focusSelector: string): boolean {
	const focusableElements = container.querySelectorAll<HTMLElement>(focusSelector);
	return focusableElements.length > 0 && element === focusableElements[focusableElements.length - 1];
}

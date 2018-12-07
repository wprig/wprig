<?php
/**
 * The header for our theme
 *
 * This is the template that displays all of the <head> section and everything up until <div id="content">
 *
 * @link https://developer.wordpress.org/themes/basics/template-files/#template-partials
 *
 * @package wp_rig
 */

namespace WP_Rig\WP_Rig;

?>
<!doctype html>
<html <?php language_attributes(); ?> class="no-js">
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1">
	<link rel="profile" href="http://gmpg.org/xfn/11">

	<?php if ( ! wp_rig()->is_amp() ) : ?>
		<script>document.documentElement.classList.remove("no-js");</script>
	<?php endif; ?>

	<?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
<div id="page" class="site">
	<a class="skip-link screen-reader-text" href="#primary"><?php esc_html_e( 'Skip to content', 'wp-rig' ); ?></a>
		<header id="masthead" class="site-header">
			<?php if ( has_header_image() ) : ?>
				<figure class="header-image">
					<?php the_header_image_tag(); ?>
				</figure><!-- .header-image -->
			<?php endif; ?>

			<div class="site-branding">
				<?php the_custom_logo(); ?>
				<?php if ( is_front_page() && is_home() ) : ?>
					<h1 class="site-title"><a href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home"><?php bloginfo( 'name' ); ?></a></h1>
				<?php else : ?>
					<p class="site-title"><a href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home"><?php bloginfo( 'name' ); ?></a></p>
				<?php endif; ?>

				<?php $wp_rig_description = get_bloginfo( 'description', 'display' ); ?>
				<?php if ( $wp_rig_description || is_customize_preview() ) : ?>
					<p class="site-description"><?php echo $wp_rig_description; /* WPCS: xss ok. */ ?></p>
				<?php endif; ?>
			</div><!-- .site-branding -->

			<?php if ( wp_rig()->is_primary_nav_menu_active() ) : ?>
				<nav id="site-navigation" class="main-navigation" aria-label="<?php esc_attr_e( 'Main menu', 'wp-rig' ); ?>"
					<?php if ( wp_rig()->is_amp() ) : ?>
						[class]=" siteNavigationMenu.expanded ? 'main-navigation toggled-on' : 'main-navigation' "
					<?php endif; ?>
				>
					<?php if ( wp_rig()->is_amp() ) : ?>
						<amp-state id="siteNavigationMenu">
							<script type="application/json">
								{
									"expanded": false
								}
							</script>
						</amp-state>
					<?php endif; ?>

					<button class="menu-toggle" aria-label="<?php esc_attr_e( 'Open menu', 'wp-rig' ); ?>" aria-controls="primary-menu" aria-expanded="false"
						<?php if ( wp_rig()->is_amp() ) : ?>
							on="tap:AMP.setState( { siteNavigationMenu: { expanded: ! siteNavigationMenu.expanded } } )"
							[aria-expanded]="siteNavigationMenu.expanded ? 'true' : 'false'"
						<?php endif; ?>
					>
						<?php esc_html_e( 'Menu', 'wp-rig' ); ?>
					</button>

					<div class="primary-menu-container">
						<?php wp_rig()->display_primary_nav_menu( array( 'menu_id' => 'primary-menu' ) ); ?>
					</div>
				</nav><!-- #site-navigation -->
			<?php endif; ?>
		</header><!-- #masthead -->

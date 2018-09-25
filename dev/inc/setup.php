<?php
/**
 * WP Rig Theme Setup
 *
 * @package wp_rig
 */

/**
 * Sets up theme defaults and registers support for various WordPress features.
 *
 * Note that this function is hooked into the after_setup_theme hook, which
 * runs before the init hook. The init hook is too late for some features, such
 * as indicating support for post thumbnails.
 */
function wp_rig_setup() {
	/*
	 * Make theme available for translation.
	 * Translations can be filed in the /languages/ directory.
	 * If you're building a theme based on wprig, use a find and replace
	 * to change 'wp-rig' to the name of your theme in all the template files.
	 */
	load_theme_textdomain( 'wp-rig', get_template_directory() . '/languages' );

	// Add default posts and comments RSS feed links to head.
	add_theme_support( 'automatic-feed-links' );

	/*
	 * Let WordPress manage the document title.
	 * By adding theme support, we declare that this theme does not use a
	 * hard-coded <title> tag in the document head, and expect WordPress to
	 * provide it for us.
	 */
	add_theme_support( 'title-tag' );

	/*
	 * Enable support for Post Thumbnails on posts and pages.
	 *
	 * @link https://developer.wordpress.org/themes/functionality/featured-images-post-thumbnails/
	 */
	add_theme_support( 'post-thumbnails' );

	// This theme uses wp_nav_menu() in one location.
	register_nav_menus(
		array(
			'primary' => esc_html__( 'Primary', 'wp-rig' ),
		)
	);

	/*
	 * Switch default core markup for search form, comment form, and comments
	 * to output valid HTML5.
	 */
	add_theme_support(
		'html5',
		array(
			'search-form',
			'comment-form',
			'comment-list',
			'gallery',
			'caption',
		)
	);

	// Set up the WordPress core custom background feature.
	add_theme_support(
		'custom-background',
		apply_filters(
			'wp_rig_custom_background_args',
			array(
				'default-color' => 'ffffff',
				'default-image' => '',
			)
		)
	);

	// Add theme support for selective refresh for widgets.
	add_theme_support( 'customize-selective-refresh-widgets' );

	/*
	 * Add support for core custom logo.
	 *
	 * @link https://codex.wordpress.org/Theme_Logo
	 */
	add_theme_support(
		'custom-logo',
		array(
			'height'      => 250,
			'width'       => 250,
			'flex-width'  => false,
			'flex-height' => false,
		)
	);

	/*
	 * Add support for wide aligments.
	 *
	 * @link https://wordpress.org/gutenberg/handbook/extensibility/theme-support/
	 */
	add_theme_support( 'align-wide' );

	/*
	 * Add support for block color palettes.
	 *
	 * @link https://wordpress.org/gutenberg/handbook/extensibility/theme-support/
	 */
	add_theme_support(
		'editor-color-palette',
		array(
			array(
				'name'  => __( 'Dusty orange', 'wp-rig' ),
				'slug'  => 'dusty-orange',
				'color' => '#ed8f5b',
			),
			array(
				'name'  => __( 'Dusty red', 'wp-rig' ),
				'slug'  => 'dusty-red',
				'color' => '#e36d60',
			),
			array(
				'name'  => __( 'Dusty wine', 'wp-rig' ),
				'slug'  => 'dusty-wine',
				'color' => '#9c4368',
			),
			array(
				'name'  => __( 'Dark sunset', 'wp-rig' ),
				'slug'  => 'dark-sunset',
				'color' => '#33223b',
			),
			array(
				'name'  => __( 'Almost black', 'wp-rig' ),
				'slug'  => 'almost-black',
				'color' => '#0a1c28',
			),
			array(
				'name'  => __( 'Dusty water', 'wp-rig' ),
				'slug'  => 'dusty-water',
				'color' => '#41848f',
			),
			array(
				'name'  => __( 'Dusty sky', 'wp-rig' ),
				'slug'  => 'dusty-sky',
				'color' => '#72a7a3',
			),
			array(
				'name'  => __( 'Dusty daylight', 'wp-rig' ),
				'slug'  => 'dusty-daylight',
				'color' => '#97c0b7',
			),
			array(
				'name'  => __( 'Dusty sun', 'wp-rig' ),
				'slug'  => 'dusty-sun',
				'color' => '#eee9d1',
			),
		)
	);

	/*
	 * Optional: Disable custom colors in block color palettes.
	 *
	 * @link https://wordpress.org/gutenberg/handbook/extensibility/theme-support/
	 *
	 * add_theme_support( 'disable-custom-colors' );
	 */

	/**
	 * Add support for font sizes.
	 *
	 * @link https://wordpress.org/gutenberg/handbook/extensibility/theme-support/
	 */
	add_theme_support(
		'editor-font-sizes',
		array(
			array(
				'name'      => __( 'small', 'wp-rig' ),
				'shortName' => __( 'S', 'wp-rig' ),
				'size'      => 16,
				'slug'      => 'small',
			),
			array(
				'name'      => __( 'regular', 'wp-rig' ),
				'shortName' => __( 'M', 'wp-rig' ),
				'size'      => 20,
				'slug'      => 'regular',
			),
			array(
				'name'      => __( 'large', 'wp-rig' ),
				'shortName' => __( 'L', 'wp-rig' ),
				'size'      => 36,
				'slug'      => 'large',
			),
			array(
				'name'      => __( 'larger', 'wp-rig' ),
				'shortName' => __( 'XL', 'wp-rig' ),
				'size'      => 48,
				'slug'      => 'larger',
			),
		)
	);

	/*
	 * Optional: Add AMP support.
	 *
	 * Add built-in support for the AMP plugin and specific AMP features.
	 * Control how the plugin, when activated, impacts the theme.
	 *
	 * @link https://wordpress.org/plugins/amp/
	 */
	add_theme_support(
		'amp',
		array(
			'comments_live_list' => true,
		)
	);

}
add_action( 'after_setup_theme', 'wp_rig_setup' );

/**
 * Set the embed width in pixels, based on the theme's design and stylesheet.
 *
 * @param array $dimensions An array of embed width and height values in pixels (in that order).
 * @return array
 */
function wp_rig_embed_dimensions( array $dimensions ) {
	$dimensions['width'] = 720;
	return $dimensions;
}
add_filter( 'embed_defaults', 'wp_rig_embed_dimensions' );

/**
 * Register widget area.
 *
 * @link https://developer.wordpress.org/themes/functionality/sidebars/#registering-a-sidebar
 */
function wp_rig_widgets_init() {
	register_sidebar(
		array(
			'name'          => esc_html__( 'Sidebar', 'wp-rig' ),
			'id'            => 'sidebar-1',
			'description'   => esc_html__( 'Add widgets here.', 'wp-rig' ),
			'before_widget' => '<section id="%1$s" class="widget %2$s">',
			'after_widget'  => '</section>',
			'before_title'  => '<h2 class="widget-title">',
			'after_title'   => '</h2>',
		)
	);
}
add_action( 'widgets_init', 'wp_rig_widgets_init' );

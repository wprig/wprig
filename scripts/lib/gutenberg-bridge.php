<?php
/**
 * WP-CLI Gutenberg Bridge
 *
 * Runs inside WordPress context to perform block discovery, theme settings lookup,
 * and fail-safe block serialization.
 */

// If we are not running inside WordPress, abort.
if ( ! defined( 'ABSPATH' ) ) {
	echo json_encode( [ 'error' => 'WordPress context not detected' ] );
	exit( 1 );
}

/**
 * Handle commands based on arguments passed via WP-CLI:
 * wp eval-file gutenberg-bridge.php -- [action]
 */
$action = isset( $args[0] ) ? trim( $args[0] ) : 'compile';
if ( '--' === $action && isset( $args[1] ) ) {
	$action = trim( $args[1] );
}

switch ( $action ) {
	case 'schema':
		echo wprig_get_blocks_schema();
		break;
	case 'settings':
		echo wprig_get_theme_settings();
		break;
	case 'compile':
	default:
		echo wprig_compile_ir_to_gutenberg();
		break;
}

/**
 * Fetch all registered blocks and their schema (attributes & supports)
 */
function wprig_get_blocks_schema() {
	$registry = \WP_Block_Type_Registry::get_instance();
	$blocks = [];

	foreach ( $registry->get_all_registered() as $name => $block_type ) {
		$blocks[ $name ] = [
			'attributes' => $block_type->attributes ?? [],
			'supports'   => $block_type->supports ?? [],
		];
	}

	return json_encode( $blocks );
}

/**
 * Fetch theme.json settings
 */
function wprig_get_theme_settings() {
	if ( class_exists( '\WP_Theme_JSON_Resolver' ) ) {
		$settings = \WP_Theme_JSON_Resolver::get_theme_data()->get_settings();
		return json_encode( $settings );
	}
	return json_encode( [] );
}

/**
 * Main compilation and validation logic
 */
function wprig_compile_ir_to_gutenberg() {
	$json = file_get_contents( 'php://stdin' );
	if ( empty( $json ) ) {
		return json_encode( [
			'is_valid'   => false,
			'markup'     => '',
			'validation' => 'INVALID',
			'errors'     => [ 'No JSON payload provided on stdin.' ],
			'warnings'   => []
		] );
	}

	$ir = json_decode( $json, true );
	if ( json_last_error() !== JSON_ERROR_NONE ) {
		return json_encode( [
			'is_valid'   => false,
			'markup'     => '',
			'validation' => 'INVALID',
			'errors'     => [ 'Malformed JSON: ' . json_last_error_msg() ],
			'warnings'   => []
		] );
	}

	if ( ! isset( $ir['blocks'] ) || ! is_array( $ir['blocks'] ) ) {
		return json_encode( [
			'is_valid'   => false,
			'markup'     => '',
			'validation' => 'INVALID',
			'errors'     => [ 'The IR payload must contain a top-level "blocks" array.' ],
			'warnings'   => []
		] );
	}

	$errors = [];
	$warnings = [];
	$formatted_blocks = [];

	foreach ( $ir['blocks'] as $index => $block_data ) {
		$path = "blocks[$index]";
		$block = wprig_format_block( $block_data, $path, $errors, $warnings );
		if ( $block !== null ) {
			$formatted_blocks[] = $block;
		}
	}

	if ( empty( $formatted_blocks ) && empty( $errors ) ) {
		$errors[] = 'No serializable blocks were found in the IR payload.';
	}

	if ( ! empty( $errors ) ) {
		return json_encode( [
			'is_valid'   => false,
			'markup'     => '',
			'validation' => 'INVALID',
			'errors'     => $errors,
			'warnings'   => $warnings
		] );
	}

	// Native WP serialization
	$markup = serialize_blocks( $formatted_blocks );

	// Round-trip verification
	$parsed = parse_blocks( $markup );
	$re_serialized = serialize_blocks( $parsed );

	if ( $markup !== $re_serialized ) {
		return json_encode( [
			'is_valid'   => false,
			'markup'     => '',
			'validation' => 'INVALID',
			'errors'     => [ 'Round-trip serialization equality check failed.' ],
			'warnings'   => $warnings
		] );
	}

	// Parse structures check
	$structure_errors = wprig_validate_parsed_structure( $formatted_blocks, $parsed );
	if ( ! empty( $structure_errors ) ) {
		return json_encode( [
			'is_valid'   => false,
			'markup'     => '',
			'validation' => 'INVALID',
			'errors'     => $structure_errors,
			'warnings'   => $warnings
		] );
	}

	return json_encode( [
		'is_valid'   => true,
		'markup'     => $markup,
		'validation' => 'VALID',
		'errors'     => [],
		'warnings'   => $warnings
	] );
}

/**
 * Helper to validate parsed block structure matching expected
 */
function wprig_validate_parsed_structure( $expected, $parsed, $path = 'blocks' ) {
	$errors = [];

	// Filter out empty auto-inserted core/paragraph / layout-empty blocks that serialize_blocks might introduce
	$parsed = array_values( array_filter( $parsed, function( $b ) {
		return ! empty( $b['blockName'] );
	} ) );

	if ( count( $expected ) !== count( $parsed ) ) {
		$errors[] = "$path count mismatch after parse. Expected " . count( $expected ) . " block(s), found " . count( $parsed ) . ".";
		return $errors;
	}

	foreach ( $expected as $index => $expected_block ) {
		$current_path = "{$path}[{$index}]";
		$parsed_block = $parsed[ $index ] ?? null;

		if ( ! is_array( $parsed_block ) ) {
			$errors[] = "$current_path is missing after parse.";
			continue;
		}

		$expected_name = $expected_block['blockName'] ?? '';
		$parsed_name   = $parsed_block['blockName'] ?? '';
		if ( $expected_name !== $parsed_name ) {
			$errors[] = "$current_path blockName mismatch after parse. Expected \"$expected_name\", found \"$parsed_name\".";
		}

		$child_errors = wprig_validate_parsed_structure(
			$expected_block['innerBlocks'] ?? [],
			$parsed_block['innerBlocks'] ?? [],
			"$current_path.innerBlocks"
		);

		if ( ! empty( $child_errors ) ) {
			$errors = array_merge( $errors, $child_errors );
		}
	}

	return $errors;
}

/**
 * Single block formatter (from IR to WP structure)
 */
function wprig_format_block( $block_data, $path, &$errors, &$warnings ) {
	$block_name = isset( $block_data['blockName'] ) ? trim( (string) $block_data['blockName'] ) : '';

	if ( empty( $block_name ) ) {
		$warnings[] = "$path is missing blockName. Falling back to core/paragraph.";
		$block_name = 'core/paragraph';
	}

	$registry = \WP_Block_Type_Registry::get_instance();
	if ( ! $registry->is_registered( $block_name ) ) {
		$errors[] = "$path uses an unregistered block type \"$block_name\".";
		return null;
	}

	$attrs = [];
	if ( isset( $block_data['attrs'] ) ) {
		if ( is_array( $block_data['attrs'] ) ) {
			$attrs = $block_data['attrs'];
		} else {
			$warnings[] = "$path.attrs must be an object. Falling back to empty object.";
		}
	}

	$inner_html = isset( $block_data['innerHTML'] ) ? (string) $block_data['innerHTML'] : '';

	$inner_blocks = [];
	if ( isset( $block_data['innerBlocks'] ) && is_array( $block_data['innerBlocks'] ) ) {
		foreach ( $block_data['innerBlocks'] as $inner_index => $inner_block_data ) {
			$inner_path = "$path.innerBlocks[$inner_index]";
			if ( ! is_array( $inner_block_data ) ) {
				$errors[] = "$inner_path must be an object.";
				continue;
			}

			$formatted_inner = wprig_format_block( $inner_block_data, $inner_path, $errors, $warnings );
			if ( $formatted_inner !== null ) {
				$inner_blocks[] = $formatted_inner;
			}
		}
	}

	if ( ! empty( $inner_blocks ) && strpos( $inner_html, '{{INNER_BLOCKS}}' ) !== false ) {
		$serialized_inner = '';
		foreach ( $inner_blocks as $child ) {
			$serialized_inner .= serialize_block( $child );
		}
		$inner_html = str_replace( '{{INNER_BLOCKS}}', $serialized_inner, $inner_html );
	}

	// Apply design token CSS classes to root HTML tag
	$inner_html = wprig_apply_attribute_classes( $block_name, $attrs, $inner_html );

	// Semantic semantic checks
	wprig_validate_semantic_consistency( $block_name, $attrs, $inner_html, $inner_blocks, $path, $errors );

	// Construct innerContent placeholder array
	$inner_content = wprig_generate_inner_content( $block_name, $attrs, $inner_html, $inner_blocks, $path, $errors );

	return [
		'blockName'    => $block_name,
		'attrs'        => $attrs,
		'innerBlocks'  => $inner_blocks,
		'innerHTML'    => $inner_html,
		'innerContent' => $inner_content,
	];
}

/**
 * Generate innerContent with placeholder nulls for children
 */
function wprig_generate_inner_content( $block_name, $attrs, $inner_html, $inner_blocks, $path, &$errors ) {
	if ( empty( $inner_blocks ) ) {
		return empty( $inner_html ) ? [] : [ $inner_html ];
	}

	if ( empty( trim( $inner_html ) ) ) {
		$errors[] = "$path contains innerBlocks but no innerHTML wrapper.";
		return array_fill( 0, count( $inner_blocks ), null );
	}

	// Leverage core's block comment wrapping and parse it
	$wrapped_markup = wprig_get_comment_delimited_block_content( $block_name, $attrs, $inner_html );
	$parsed_blocks = parse_blocks( $wrapped_markup );
	$parsed_parent = $parsed_blocks[0] ?? null;

	if ( ! is_array( $parsed_parent ) || ! isset( $parsed_parent['innerContent'] ) ) {
		$errors[] = "$path could not be parsed into a valid innerContent structure.";
		return [ $inner_html ];
	}

	return $parsed_parent['innerContent'];
}

/**
 * Build block HTML with block comment wraps
 */
function wprig_get_comment_delimited_block_content( $block_name, $attrs, $inner_html ) {
	// If the core function already exists, prefer using it
	if ( function_exists( 'get_comment_delimited_block_content' ) ) {
		return get_comment_delimited_block_content( $block_name, $attrs, $inner_html );
	}

	$serialized_attrs = empty( $attrs ) ? '' : ' ' . json_encode( $attrs );
	$open_tag = "<!-- wp:" . str_replace( 'core/', '', $block_name ) . $serialized_attrs . " -->";
	$close_tag = "<!-- /wp:" . str_replace( 'core/', '', $block_name ) . " -->";
	return $open_tag . $inner_html . $close_tag;
}

/**
 * Map block attributes to proper Gutenberg CSS classes
 */
function wprig_apply_attribute_classes( $block_name, $attrs, $inner_html ) {
	if ( empty( trim( $inner_html ) ) || ! class_exists( '\WP_HTML_Tag_Processor' ) ) {
		return $inner_html;
	}

	$tags = new \WP_HTML_Tag_Processor( $inner_html );

	if ( $tags->next_tag() ) {
		// Align
		if ( ! empty( $attrs['align'] ) ) {
			$tags->add_class( 'align' . $attrs['align'] );
		}

		// Text alignment
		if ( ! empty( $attrs['textAlign'] ) ) {
			$tags->add_class( 'has-text-align-' . $attrs['textAlign'] );
		}

		// Background Color
		if ( ! empty( $attrs['backgroundColor'] ) ) {
			$tags->add_class( 'has-' . $attrs['backgroundColor'] . '-background-color' );
			$tags->add_class( 'has-background' );
		}

		// Text Color
		if ( ! empty( $attrs['textColor'] ) ) {
			$tags->add_class( 'has-' . $attrs['textColor'] . '-color' );
			$tags->add_class( 'has-text-color' );
		}

		// Font Size
		if ( ! empty( $attrs['fontSize'] ) ) {
			$tags->add_class( 'has-' . $attrs['fontSize'] . '-font-size' );
		}

		// Custom ClassName
		if ( ! empty( $attrs['className'] ) ) {
			foreach ( explode( ' ', $attrs['className'] ) as $class ) {
				if ( ! empty( trim( $class ) ) ) {
					$tags->add_class( $class );
				}
			}
		}

		// Core block type class
		$type_class = 'wp-block-' . str_replace( 'core/', '', $block_name );
		$type_class = str_replace( '/', '-', $type_class );
		$tags->add_class( $type_class );
	}

	return $tags->get_updated_html();
}

/**
 * Verify HTML semantic consistency with block attributes
 */
function wprig_validate_semantic_consistency( $block_name, $attrs, $inner_html, $inner_blocks, $path, &$errors ) {
	if ( empty( trim( $inner_html ) ) && empty( $inner_blocks ) ) {
		return;
	}

	$first_tag = wprig_get_first_tag_name( $inner_html );

	$expected_tags = [
		'core/paragraph' => 'p',
		'core/quote'     => 'blockquote',
		'core/list-item' => 'li',
	];

	if ( isset( $expected_tags[ $block_name ] ) ) {
		$expected_tag = $expected_tags[ $block_name ];
		if ( $first_tag !== $expected_tag ) {
			$errors[] = "$path expected <$expected_tag> as the first HTML tag, found <" . ( empty( $first_tag ) ? 'none' : $first_tag ) . ">.";
		}
	}

	if ( 'core/heading' === $block_name ) {
		$level = isset( $attrs['level'] ) ? (int) $attrs['level'] : 2;
		$level = max( 1, min( 6, $level ) );
		$expected_tag = "h{$level}";

		if ( $first_tag !== $expected_tag ) {
			$errors[] = "$path expected <$expected_tag> as the first HTML tag based on attrs.level, found <" . ( empty( $first_tag ) ? 'none' : $first_tag ) . ">.";
		}
	}

	if ( 'core/list' === $block_name ) {
		$expected_tag = ! empty( $attrs['ordered'] ) ? 'ol' : 'ul';
		if ( $first_tag !== $expected_tag ) {
			$errors[] = "$path expected <$expected_tag> as the first HTML tag based on attrs.ordered, found <" . ( empty( $first_tag ) ? 'none' : $first_tag ) . ">.";
		}
	}
}

/**
 * Get first HTML tag name
 */
function wprig_get_first_tag_name( $inner_html ) {
	if ( class_exists( '\WP_HTML_Tag_Processor' ) ) {
		$processor = new \WP_HTML_Tag_Processor( $inner_html );
		if ( $processor->next_tag() ) {
			return strtolower( $processor->get_tag() );
		}
	}
	if ( preg_match( '/<\s*([a-zA-Z0-9:-]+)/', $inner_html, $matches ) ) {
		return strtolower( $matches[1] );
	}
	return '';
}

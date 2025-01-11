<?php
declare(strict_types=1);

use Rector\Config\RectorConfig;
use Rector\Set\ValueObject\SetList;
use Rector\TypeDeclaration\Rector\Property\TypedPropertyFromStrictConstructorRector;

return static function (RectorConfig $rectorConfig): void {
	// Specify paths to analyze
	$rectorConfig->paths([
		__DIR__,
	]);

	// Skip these directories
	$rectorConfig->skip([
		__DIR__ . '/vendor',
		__DIR__ . '/node_modules',
		__DIR__ . '/tests', // Optional
	]);

	// Add single rule
	$rectorConfig->rule(TypedPropertyFromStrictConstructorRector::class);

	// Add prepared sets of rules
	$rectorConfig->sets([
		SetList::DEAD_CODE,
		SetList::CODE_QUALITY,
	]);
};

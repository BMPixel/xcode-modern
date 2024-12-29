const fs = require('fs');
const path = require('path');
const { DOMParser, XMLSerializer } = require('xmldom');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

async function scaleSvgViewBox(svgPath, scaleFactor, outputPath) {
    try {
        const svgContent = fs.readFileSync(svgPath, 'utf-8');
        const doc = new DOMParser().parseFromString(svgContent, 'image/svg+xml');
        const svgElement = doc.documentElement;

        const viewBoxAttr = svgElement.getAttribute('viewBox');

        if (viewBoxAttr) {
            const [minX, minY, width, height] = viewBoxAttr.split(/\s+/).map(parseFloat);

            // Calculate new dimensions
            const newWidth = width * scaleFactor;
            const newHeight = height * scaleFactor;

            // Calculate new min_x and min_y to keep the content centered
            const newMinX = minX - (newWidth - width) / 2;
            const newMinY = minY - (newHeight - height) / 2;

            // Update viewBox attribute
            svgElement.setAttribute('viewBox', `${newMinX} ${newMinY} ${newWidth} ${newHeight}`);

            // Write the modified SVG to the output file
            const serializer = new XMLSerializer();
            const updatedSvgContent = serializer.serializeToString(doc);
            fs.writeFileSync(outputPath, updatedSvgContent, 'utf-8');
        } else {
            console.warn(`Warning: No viewBox attribute found in ${svgPath}. Skipping.`);
        }
    } catch (e) {
        console.error(`An error occurred processing ${svgPath}:`, e);
    }
}

async function processSvgDirectory(inputDir, outputDir, scaleFactor) {
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const files = fs.readdirSync(inputDir);
    for (const filename of files) {
        if (filename.endsWith('.svg')) {
            const inputPath = path.join(inputDir, filename);
            const outputPath = path.join(outputDir, filename);

            await scaleSvgViewBox(inputPath, scaleFactor, outputPath);
            console.log(`Processed: ${filename}`);
        }
    }
}

const argv = yargs(hideBin(process.argv))
    .option('input', {
        alias: 'i',
        description: 'Input directory containing SVG files',
        type: 'string',
        demandOption: true, // Make it a required option
    })
    .option('output', {
        alias: 'o',
        description: 'Output directory for scaled SVG files',
        type: 'string',
        demandOption: true,
    })
    .option('scale', {
        alias: 's',
        description: 'Scaling factor',
        type: 'number',
        default: 2.0,
    })
    .help()
    .alias('help', 'h')
    .argv;

processSvgDirectory(argv.input, argv.output, argv.scale);
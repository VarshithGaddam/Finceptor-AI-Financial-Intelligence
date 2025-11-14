/**
 * Splits an array into smaller batches of a specified size.
 * @param {Array} array - The array to batch.
 * @param {number} batchSize - The size of each batch.
 * @returns {Array<Array>} Array of batches.
 */
function batchArray(array, batchSize) {
    const batches = [];
    for (let i = 0; i < array.length; i += batchSize) {
        batches.push(array.slice(i, i + batchSize));
    }
    return batches;
}

module.exports = { batchArray };
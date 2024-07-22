

function divideNumberRandomly(inputNumber, numberOfParts) {
    if (numberOfParts <= 0) {
        throw new Error('Number of parts must be greater than zero.');
    }

    // Generate (numberOfParts - 1) random integers that sum to less than inputNumber
    const randomNumbers = Array.from({ length: numberOfParts - 1 }, () => Math.floor(Math.random() * inputNumber));

    // Sort the random numbers
    randomNumbers.sort((a, b) => a - b);

    // Add boundaries at 0 and inputNumber
    randomNumbers.unshift(0);
    randomNumbers.push(inputNumber);

    // Calculate the integer segments
    const parts = [];
    for (let i = 1; i < randomNumbers.length; i++) {
        parts.push(randomNumbers[i] - randomNumbers[i - 1]);
    }

    // Ensure all parts are integers and sum up to the inputNumber
    const sum = parts.reduce((acc, part) => acc + part, 0);
    if (sum !== inputNumber) {
        throw new Error('The sum of parts does not equal the input number.');
    }

    return parts;
}


function sqrtPriceX96ToPrice(sqrtPriceX96){
  const sqrtPrice = sqrtPriceX96.toString() / (2 ** 96);
  const price = sqrtPrice ** 2;
  return price;

}

function priceToSqrtPriceX96(price) {
    // Price should be a number
    const sqrtPrice = Math.sqrt(price);
    const sqrtPriceX96 = String(sqrtPrice * (2 ** 96));
    return sqrtPriceX96;
  }
  

module.exports = {
    divideNumberRandomly,
    sqrtPriceX96ToPrice,
    priceToSqrtPriceX96
}
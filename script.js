// Get references to the main lists and buttons
const makkahList = document.getElementById('makkah-hotels-list');
const madinahList = document.getElementById('madinah-hotels-list');

const addMakkahBtn = document.getElementById('add-makkah');
const addMadinahBtn = document.getElementById('add-madinah');
const generateBtn = document.getElementById('generate-packages');
const outputContainer = document.getElementById('output-container');

let hotelBoxCounter = 0;

// --- Function to add a new hotel box ---
const addHotelBox = (targetList) => {
    hotelBoxCounter++;
    const box = document.createElement('div');
    box.className = 'hotel-box';
    
    box.innerHTML = `
        <button class="btn-remove" title="Remove hotel">&times;</button>
        <div>
            <label for="hotel_name_${hotelBoxCounter}">Hotel Name</label>
            <input type="text" id="hotel_name_${hotelBoxCounter}" class="hotel-name" placeholder="e.g. Makkah Hotel A">
        </div>
        <div>
            <label for="hotel_price_${hotelBoxCounter}">Total Room Price (£)</label>
            <input type="number" id="hotel_price_${hotelBoxCounter}" class="hotel-price" placeholder="e.g. 400" min="0">
        </div>
    `;
    targetList.appendChild(box);
};

// --- Function to handle removing a hotel box ---
const handleListClick = (e) => {
    if (e.target.classList.contains('btn-remove')) {
        e.target.closest('.hotel-box').remove();
    }
};

// --- Function to read all hotel data from a list ---
const readHotelData = (list) => {
    const hotels = [];
    const boxes = list.querySelectorAll('.hotel-box');
    
    boxes.forEach(box => {
        const name = box.querySelector('.hotel-name').value.trim();
        const price = parseFloat(box.querySelector('.hotel-price').value);

        // Only add if both name and price are valid
        if (name && !isNaN(price) && price >= 0) {
            hotels.push({ name, price });
        }
    });
    return hotels;
};

// --- Main Function: Generate Packages ---
const generatePackages = () => {
    // 1. Get Guest Counts
    const numAdults = parseInt(document.getElementById('adults').value, 10) || 0;
    const numChildren = parseInt(document.getElementById('children_paying').value, 10) || 0;
    const totalPayingGuests = numAdults + numChildren;

    // Validation
    if (totalPayingGuests === 0) {
        outputContainer.innerHTML = `<p style="color: red; font-weight: bold;">Error: Please enter at least one Adult or Child (5-12) to calculate per-person pricing.</p>`;
        return;
    }

    // 2. Read Hotel Data
    const makkahHotels = readHotelData(makkahList);
    const madinahHotels = readHotelData(madinahList);

    if (makkahHotels.length === 0 || madinahHotels.length === 0) {
        outputContainer.innerHTML = `<p style="color: red; font-weight: bold;">Error: Please add at least one valid hotel (with name and price) to both Makkah and Madinah lists.</p>`;
        return;
    }

    // 3. Mix & Match (Cartesian Product)
    const allCombinations = [];
    for (const makkah of makkahHotels) {
        for (const madinah of madinahHotels) {
            allCombinations.push([makkah, madinah]);
        }
    }

    // 4. Calculate and Format
    const finalPackages = allCombinations.map(combo => {
        const [makkah, madinah] = combo;
        const totalPrice = makkah.price + madinah.price;
        const perPersonPrice = totalPrice / totalPayingGuests;

        return {
            makkahName: makkah.name,
            madinahName: madinah.name,
            totalPrice: totalPrice,
            perPersonPrice: perPersonPrice
        };
    });

    // 5. Sort by Total Price (low to high)
    finalPackages.sort((a, b) => a.totalPrice - b.totalPrice);

    // 6. Display the Results
    outputContainer.innerHTML = ''; // Clear previous results

    if (finalPackages.length === 0) {
        outputContainer.innerHTML = `<p>No valid packages could be generated. Check your inputs.</p>`;
        return;
    }

    finalPackages.forEach((pkg, index) => {
        const packageHTML = `
            <div class="package-result">
                <h3>Package ${index + 1}</h3>
                <p>
                    <strong>Makkah:</strong> ${pkg.makkahName}<br>
                    <strong>Madinah:</strong> ${pkg.madinahName}
                </p>
                <div class="package-price">
                    <span>Per Person Price: £${pkg.perPersonPrice.toFixed(2)}</span>
                    <span class="total">Total Hotel Cost: £${pkg.totalPrice.toFixed(2)}</span>
                </div>
            </div>
        `;
        outputContainer.innerHTML += packageHTML;
    });
};

// --- Event Listeners ---
addMakkahBtn.addEventListener('click', () => addHotelBox(makkahList));
addMadinahBtn.addEventListener('click', () => addHotelBox(madinahList));

// Use event delegation for remove buttons
makkahList.addEventListener('click', handleListClick);
madinahList.addEventListener('click', handleListClick);

// Main generate button
generateBtn.addEventListener('click', generatePackages);

// Add one of each box by default for usability
addHotelBox(makkahList);
addHotelBox(madinahList);

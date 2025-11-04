// Get references to the main lists and buttons
const makkahList = document.getElementById('makkah-hotels-list');
const madinahList = document.getElementById('madinah-hotels-list');

const addMakkahBtn = document.getElementById('add-makkah');
const addMadinahBtn = document.getElementById('add-madinah');
const generateBtn = document.getElementById('generate-packages');
const outputContainer = document.getElementById('output-container');
// *** NEW: Get the "Copy All" button ***
const copyAllBtn = document.getElementById('copy-all-btn');

let hotelBoxCounter = 0;

// --- Function to add a new hotel box ---
const addHotelBox = (targetList) => {
    hotelBoxCounter++;
    const box = document.createElement('div');
    box.className = 'hotel-box';
    
    box.innerHTML = `
        <button class="btn-remove" title="Remove hotel">&times;</button>
        <div>
            <label for="hotel_summary_${hotelBoxCounter}">Hotel Summary</label>
            <textarea 
                id="hotel_summary_${hotelBoxCounter}" 
                class="hotel-summary" 
                placeholder="e.g. Makkah Hotel A - 5 Nights\nQuad Room, Half Board\nNear Haram Gate 79"></textarea>
        </div>
        <div>
            <label for="hotel_price_${hotelBoxCounter}">Total Room Price (£)</label>
            <input 
                type="number" 
                id="hotel_price_${hotelBoxCounter}" 
                class="hotel-price" 
                placeholder="e.g. 400" 
                min="0">
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
        const summary = box.querySelector('.hotel-summary').value.trim();
        const price = parseFloat(box.querySelector('.hotel-price').value);

        if (summary && !isNaN(price) && price >= 0) {
            hotels.push({ summary, price });
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

    // --- Validation and Error States ---
    const showError = (message) => {
        outputContainer.innerHTML = `<p style="color: red; font-weight: bold;">${message}</p>`;
        copyAllBtn.style.display = 'none'; // Hide copy button on error
    };

    if (totalPayingGuests === 0) {
        showError("Error: Please enter at least one Adult or Child (5-12) to calculate per-person pricing.");
        return;
    }

    // 2. Read Hotel Data
    const makkahHotels = readHotelData(makkahList);
    const madinahHotels = readHotelData(madinahList);

    if (makkahHotels.length === 0 || madinahHotels.length === 0) {
        showError("Error: Please add at least one valid hotel (with summary and price) to both Makkah and Madinah lists.");
        return;
    }

    const itineraryOrder = document.querySelector('input[name="itinerary_order"]:checked').value;

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
            makkahSummary: makkah.summary,
            madinahSummary: madinah.summary,
            totalPrice: totalPrice,
            perPersonPrice: perPersonPrice
        };
    });

    // 5. Sort by Total Price (low to high)
    finalPackages.sort((a, b) => a.totalPrice - b.totalPrice);

    // 6. Display the Results
    outputContainer.innerHTML = ''; 
    let allOptionsCopyText = ""; // *** NEW: Master string for all copy text ***

    if (finalPackages.length === 0) {
        showError("No valid packages could be generated. Check your inputs.");
        return;
    }

    finalPackages.forEach((pkg, index) => {
        
        const city1Label = (itineraryOrder === 'makkah') ? 'Makkah' : 'Madinah';
        const city1Summary = (itineraryOrder === 'makkah') ? pkg.makkahSummary : pkg.madinahSummary;
        
        const city2Label = (itineraryOrder === 'makkah') ? 'Madinah' : 'Makkah';
        const city2Summary = (itineraryOrder === 'makkah') ? pkg.madinahSummary : pkg.makkahSummary;

        // *** NEW: Build the plain text for this option ***
        const copyText = `*Option ${index + 1}*

*(${city1Label})*
${city1Summary}

*(${city2Label})*
${city2Summary}

*Per Person Price: £${pkg.perPersonPrice.toFixed(2)}*
*Total Hotel Cost: £${pkg.totalPrice.toFixed(2)}*`;

        // *** MODIFIED: HTML no longer contains a copy button ***
        const packageHTML = `
            <div class="package-result">
                <h3>*Option ${index + 1}*</h3>
                <p><strong>*(${city1Label})*</strong></p>
                <p class="summary-text">${city1Summary}</p>
                
                <p><strong>*(${city2Label})*</strong></p>
                <p class="summary-text">${city2Summary}</p>
                
                <div class="package-price">
                    <span>*Per Person Price: £${pkg.perPersonPrice.toFixed(2)}*</span>
                    <span class="total">*Total Hotel Cost: £${pkg.totalPrice.toFixed(2)}*</span>
                </div>
            </div>
        `;
        
        outputContainer.innerHTML += packageHTML;
        
        // *** NEW: Add this option's text to the master string ***
        allOptionsCopyText += copyText;

        // Add separators (HTML and plain text)
        if (index < finalPackages.length - 1) {
             outputContainer.innerHTML += '<p class="text-separator">----------------------------</p>';
             allOptionsCopyText += '\n----------------------------\n\n'; // Add separator to master text
        }
    });

    // 7. Attach master string to the "Copy All" button and show it
    copyAllBtn.dataset.copyText = allOptionsCopyText;
    copyAllBtn.style.display = 'inline-block'; // Show the button
};

// --- *** MODIFIED: Function to handle the "Copy All" click *** ---
const handleCopyClick = async () => {
    const textToCopy = copyAllBtn.dataset.copyText;

    if (!textToCopy) return; // No text to copy

    try {
        await navigator.clipboard.writeText(textToCopy);
        
        const originalText = copyAllBtn.textContent;
        copyAllBtn.textContent = 'Copied!';
        copyAllBtn.classList.add('copied');
        
        setTimeout(() => {
            copyAllBtn.textContent = originalText;
            copyAllBtn.classList.remove('copied');
        }, 2000);

    } catch (err) {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy text. Please copy manually.');
    }
};


// --- Event Listeners ---
addMakkahBtn.addEventListener('click', () => addHotelBox(makkahList));
addMadinahBtn.addEventListener('click', () => addHotelBox(madinahList));

// Use event delegation for remove buttons
makkahList.addEventListener('click', handleListClick);
madinahList.addEventListener('click', handleListClick);

// Main generate button
generateBtn.addEventListener('click', generatePackages);

// *** MODIFIED: Add listener to the "Copy All" button ***
copyAllBtn.addEventListener('click', handleCopyClick);

// Add one of each box by default for usability
addHotelBox(makkahList);
addHotelBox(madinahList);

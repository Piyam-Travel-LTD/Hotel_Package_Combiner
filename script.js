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

    if (totalPayingGuests === 0) {
        outputContainer.innerHTML = `<p style="color: red; font-weight: bold;">Error: Please enter at least one Adult or Child (5-12) to calculate per-person pricing.</p>`;
        return;
    }

    // 2. Read Hotel Data
    const makkahHotels = readHotelData(makkahList);
    const madinahHotels = readHotelData(madinahList);

    if (makkahHotels.length === 0 || madinahHotels.length === 0) {
        outputContainer.innerHTML = `<p style="color: red; font-weight: bold;">Error: Please add at least one valid hotel (with summary and price) to both Makkah and Madinah lists.</p>`;
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

    if (finalPackages.length === 0) {
        outputContainer.innerHTML = `<p>No valid packages could be generated. Check your inputs.</p>`;
        return;
    }

    finalPackages.forEach((pkg, index) => {
        
        const city1Label = (itineraryOrder === 'makkah') ? 'Makkah' : 'Madinah';
        const city1Summary = (itineraryOrder === 'makkah') ? pkg.makkahSummary : pkg.madinahSummary;
        
        const city2Label = (itineraryOrder === 'makkah') ? 'Madinah' : 'Makkah';
        const city2Summary = (itineraryOrder === 'makkah') ? pkg.madinahSummary : pkg.makkahSummary;

        // *** NEW: Create the plain text for the copy button ***
        // This includes the separator line at the end.
        const copyText = `*Option ${index + 1}*

*(${city1Label})*
${city1Summary}

*(${city2Label})*
${city2Summary}

*Per Person Price: £${pkg.perPersonPrice.toFixed(2)}*
*Total Hotel Cost: £${pkg.totalPrice.toFixed(2)}*
----------------------------`;

        // *** NEW: Build the HTML for display ***
        // We use separate <p> tags for heading and summary to control spacing.
        // The `data-copy-text` attribute holds the clean text.
        const packageHTML = `
            <div class="package-result">
                <button class="btn-copy" data-copy-text="${escape(copyText)}">Copy Option</button>
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
        
        // Add the text separator *between* options
        if (index < finalPackages.length - 1) {
             outputContainer.innerHTML += '<p class="text-separator">----------------------------</p>';
        }
    });
};

// --- *** NEW: Function to handle all "Copy" clicks *** ---
const handleCopyClick = async (e) => {
    // Only act if the clicked element is a copy button
    if (!e.target.classList.contains('btn-copy')) {
        return;
    }

    const copyButton = e.target;
    // Get the text from the 'data-copy-text' attribute
    // We use 'unescape' to handle special characters
    const textToCopy = unescape(copyButton.dataset.copyText);

    try {
        // Use the modern Clipboard API
        await navigator.clipboard.writeText(textToCopy);
        
        // Visual feedback
        const originalText = copyButton.textContent;
        copyButton.textContent = 'Copied!';
        copyButton.classList.add('copied');
        
        // Reset button text after 2 seconds
        setTimeout(() => {
            copyButton.textContent = originalText;
            copyButton.classList.remove('copied');
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

// *** NEW: Add one listener to the container for all copy clicks ***
outputContainer.addEventListener('click', handleCopyClick);

// Add one of each box by default for usability
addHotelBox(makkahList);
addHotelBox(madinahList);

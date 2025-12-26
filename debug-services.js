
async function checkServices() {
    const categories = ["Hair Services", "Skin & Facial", "Dog Grooming", "Makeup Services"];
    const baseUrl = 'http://localhost:3000';

    for (const category of categories) {
        console.log(`Checking category: ${category}`);
        try {
            const url = `${baseUrl}/api/services?category=${encodeURIComponent(category)}&status=listed&limit=12`;
            const response = await fetch(url);
            const data = await response.json();

            console.log(`Status: ${response.status}`);
            console.log(`Total from pagination: ${data.pagination?.total}`);
            console.log(`Services length: ${data.services?.length}`);
            console.log(`Services IDs: ${data.services?.map(s => s.id || s._id).join(', ')}`);
            console.log('---');
        } catch (error) {
            console.error(`Error checking ${category}:`, error);
        }
    }
}

checkServices();

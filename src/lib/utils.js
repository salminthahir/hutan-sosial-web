/**
 * Parses a permit name string that might end with an institution type prefix (e.g., 'LD')
 * and separates it into a clean display title and the institution type badge text.
 * 
 * Example: 'Hutan Desa Woda LD' -> { title: 'Hutan Desa Woda', badge: 'LD' }
 */
export function parsePermitName(fullName) {
    if (!fullName) return { title: 'Tidak Diketahui', badge: '' };

    // Ordered to match longest/most specific types first if needed, 
    // though these distinct types generally don't overlap dangerously.
    const types = ['LD', 'Koperasi', 'KTH', 'Poktan', 'Gapoktanhut', 'Gapoktan', 'LPHD', 'LPMD'];

    let title = fullName.trim();
    let badge = '';

    for (const type of types) {
        // Look for the type at the end of the string, preceded by a space
        const regex = new RegExp(`\\s+${type}$`, 'i');
        if (regex.test(title)) {
            // Find the original case of the matched suffix for the badge
            const match = title.match(regex)[0].trim();
            badge = match;
            // Remove the suffix from the title
            title = title.replace(regex, '').trim();
            break;
        }
    }

    return { title, badge };
}

import { writable } from 'svelte/store';

export const fav = writable([]);

const localFav = localStorage.getItem("fav");
if (localFav) {
    try {
        const parsed = JSON.parse(localFav);
        if (parsed.constructor === Array) {
            fav.set(parsed);
        }
    }
    catch (e) {

    }
}

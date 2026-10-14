/* Portable native test for the SAME C definitions in forked driver/Start. */
#include <wchar.h>
#include <stddef.h>
#include "mivubi_core_identity.h"

_Static_assert(sizeof(MIVUBI_PRIVATE_DRIVER_ID) / sizeof(wchar_t) <= 16,
               "Sandboxie API_GET_VERSION WCHAR[16] would overflow");
_Static_assert(MIVUBI_PRIVATE_DRIVER_ABI == 0x57230U,
               "Pinned Sandboxie driver ABI changed unexpectedly");

int main(void) {
    const wchar_t *official = L"5.73.5";
    const wchar_t *private_driver = MIVUBI_PRIVATE_DRIVER_ID;
    wchar_t observed[16] = {0};
    if (wcscmp(private_driver, official) == 0) return 1;
    if (wcscmp(private_driver, L"5.73.5-MIVU") != 0) return 2;
    if (wcslen(private_driver) >= sizeof(observed) / sizeof(observed[0])) return 3;
    wcscpy(observed, private_driver);
    if (wcscmp(observed, MIVUBI_PRIVATE_DRIVER_ID) != 0) return 4;
    if (!MivubiOwnedDriverMatches(observed, MIVUBI_PRIVATE_DRIVER_ABI)) return 5;
    if (MivubiOwnedDriverMatches(official, MIVUBI_PRIVATE_DRIVER_ABI)) return 6;
    if (MivubiOwnedDriverMatches(observed, MIVUBI_PRIVATE_DRIVER_ABI + 1)) return 7;
    if (MivubiOwnedDriverMatches(NULL, MIVUBI_PRIVATE_DRIVER_ABI)) return 8;
    return 0;
}

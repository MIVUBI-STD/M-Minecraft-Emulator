/* Shared identity for the MIVUBI-owned Sandboxie-derived core.
 * Included verbatim in the pinned private driver API and Start.exe sources.
 * This is runtime identification, NOT signing/attestation or a new ABI.
 */
#ifndef MIVUBI_OWNED_CORE_IDENTITY_H
#define MIVUBI_OWNED_CORE_IDENTITY_H
#define MIVUBI_PRIVATE_DRIVER_ID L"5.73.5-MIVU"
#define MIVUBI_PRIVATE_DRIVER_ABI 0x57230U
#include <wchar.h>
/* The same runtime decision is used by Start.exe and portable native tests.
 * A matching version alone is insufficient without the pinned ABI.
 */
static inline int MivubiOwnedDriverMatches(const wchar_t *observed,
                                           unsigned long abi) {
    return observed != NULL &&
           abi == MIVUBI_PRIVATE_DRIVER_ABI &&
           wcscmp(observed, MIVUBI_PRIVATE_DRIVER_ID) == 0;
}
/* API_GET_VERSION accepts a WCHAR[16]. The marker must fit, including NUL. */
#endif

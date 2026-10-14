#include <cassert>
#include <cwchar>
#include <string>
#include "mivubi_owned_start_policy.h"

using Decision = MivubiOwnedDecision;
static unsigned checks = 0;

static void check(const wchar_t* raw, Decision expected,
                  const wchar_t* box = nullptr) {
    std::wstring command(raw);
    MivubiOwnedLaunch result{nullptr, nullptr};
    const Decision actual = MivubiParseOwnedStart(command.data(), &result);
    assert(actual == expected);
    if (actual == Decision::Admitted) {
        assert(result.box && result.command);
        assert(box && std::wcscmp(box, result.box) == 0);
        assert(result.command[0] == L'"');
    } else {
        assert(!result.box && !result.command);
    }
    ++checks;
}

int main() {
    check(L"/box:MivubiEdu02 \"C:\\Minecraft.Windows.exe\"", Decision::NotOwned);
    check(L"/mivubi_client:02 \"C:\\Program Files\\Minecraft.Windows.exe\"",
          Decision::Admitted, L"MivubiEdu02");
    check(L"/mivubi_client:03 \"D:\\Games\\MinecraftEducation.exe\"",
          Decision::Admitted, L"MivubiEdu03");
    check(L"/mivubi_client:04 \"E:\\Test\\MinecraftEducationEdition.exe\"",
          Decision::Admitted, L"MivubiEdu04");
    check(L"/mivubi_client:02 \"C:\\MINECRAFT.WINDOWS.EXE\"",
          Decision::Admitted, L"MivubiEdu02");
    check(L"/mivubi_client:01 \"C:\\Minecraft.Windows.exe\"", Decision::Rejected);
    check(L"/mivubi_client:05 \"C:\\Minecraft.Windows.exe\"", Decision::Rejected);
    check(L"/mivubi_client:02 C:\\Minecraft.Windows.exe", Decision::Rejected);
    check(L"/mivubi_client:02 \"C:\\Minecraft.Windows.exe\" /terminate_all",
          Decision::Rejected);
    check(L"/mivubi_client:02 \"\\\\server\\Minecraft.Windows.exe\"", Decision::Rejected);
    check(L"/mivubi_client:02 \"C:\\..\\Minecraft.Windows.exe\"", Decision::Rejected);
    check(L"/mivubi_client:02 \"C:\\folder\\..\\Minecraft.Windows.exe\"",
          Decision::Rejected);
    check(L"/mivubi_client:02 \"C:\\Notepad.exe\"", Decision::Rejected);
    check(L"/mivubi_client:02 \"C:\\folder\\\\Minecraft.Windows.exe\"",
          Decision::Rejected);
    check(L"/mivubi_client:02 \"C:\\Minecraft.Windows.exe\\\"", Decision::Rejected);
    check(L"/mivubi_client:02 \"C:\\Minecraft.Windows.exe\"\"", Decision::Rejected);
    check(L"/mivubi_client:02 \"C:\\folder\\.\\Minecraft.Windows.exe\"",
          Decision::Rejected);
    check(L"/mivubi_client:02 \"C:\\folder\\Minecraft.Windows.exe:ads\"",
          Decision::Rejected);
    check(L"/mivubi_client:02 \"C:/Minecraft.Windows.exe\"", Decision::Rejected);
    check(L"/mivubi_client:02 \"C:\\Minecraft.Windows.exe\"", Decision::Admitted,
          L"MivubiEdu02");
    return checks >= 20 ? 0 : 1;
}

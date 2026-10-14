cmake_minimum_required(VERSION 3.23)
project(MivubiIsolationAbiProbe LANGUAGES CXX)

# A standalone read-only ABI tool, never a driver/service installer.
if(NOT WIN32 OR NOT MSVC OR CMAKE_SIZEOF_VOID_P LESS 8)
  message(FATAL_ERROR "Isolation ABI probe requires 64-bit MSVC on Windows.")
endif()
if(MSVC_VERSION LESS 1930)
  message(FATAL_ERROR "Visual Studio 2022 MSVC or newer is required.")
endif()

set(UPSTREAM_ROOT "${CMAKE_CURRENT_LIST_DIR}/../isolation-upstream/Sandboxie")
if(NOT EXISTS "${UPSTREAM_ROOT}/Sandboxie/common/my_version.h")
  message(FATAL_ERROR "Initialize the pinned Sandboxie submodule first.")
endif()

find_package(Git REQUIRED)
execute_process(
  COMMAND "${GIT_EXECUTABLE}" -C "${UPSTREAM_ROOT}" rev-parse HEAD
  OUTPUT_VARIABLE UPSTREAM_SHA
  OUTPUT_STRIP_TRAILING_WHITESPACE
  RESULT_VARIABLE GIT_RESULT
)
if(NOT GIT_RESULT EQUAL 0 OR
   NOT UPSTREAM_SHA STREQUAL "abd4c240031cfb46666daa74ca47ed4e48b561e4")
  message(FATAL_ERROR "ABI source must match pinned Sandboxie v1.18.5 SHA.")
endif()

add_executable(mivubi-isolation-abi-probe src/abi_probe.cpp)
target_compile_features(mivubi-isolation-abi-probe PRIVATE cxx_std_17)
target_include_directories(mivubi-isolation-abi-probe PRIVATE "${UPSTREAM_ROOT}/Sandboxie")
target_compile_definitions(mivubi-isolation-abi-probe PRIVATE
  UNICODE _UNICODE)
target_link_libraries(mivubi-isolation-abi-probe PRIVATE advapi32 wintrust)
target_compile_options(mivubi-isolation-abi-probe PRIVATE /W4 /WX /sdl)

enable_testing()
add_test(NAME source_abi_contract_selftest
  COMMAND mivubi-isolation-abi-probe --selftest)

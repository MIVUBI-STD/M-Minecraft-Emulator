cmake_minimum_required(VERSION 3.16)
project(MivubiOwnedStartPolicy LANGUAGES CXX)

# Real C++ policy test for the SAME source that is inlined into the forked
# Sandboxie Start.exe; runs without Windows SDK, a driver, accounts or GitHub.
add_executable(mivubi-owned-start-policy-test
  mivubi_owned_start_policy.test.cpp)
set_target_properties(mivubi-owned-start-policy-test PROPERTIES
  CXX_STANDARD 17 CXX_STANDARD_REQUIRED YES CXX_EXTENSIONS NO)
if(MSVC)
  target_compile_options(mivubi-owned-start-policy-test PRIVATE /W4 /WX)
else()
  target_compile_options(mivubi-owned-start-policy-test PRIVATE
    -Wall -Wextra -Werror -pedantic)
endif()

enable_testing()
add_test(NAME owned_start_policy_native
  COMMAND mivubi-owned-start-policy-test)

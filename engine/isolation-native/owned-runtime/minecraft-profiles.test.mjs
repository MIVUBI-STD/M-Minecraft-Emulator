import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {ownedMinecraftProfiles, planOwnedMinecraftProfiles, ownedMinecraftLaunch}
  from "./minecraft-profiles.mjs";

test("three functional MIVUBI boxes have stable distinct identities", () => {
  const actual = ownedMinecraftProfiles();
  assert.deepEqual(actual.map(x=>x.client), ["02","03","04"]);
  assert.deepEqual(actual.map(x=>x.box),
    ["MivubiEdu02","MivubiEdu03","MivubiEdu04"]);
  assert.ok(actual.every(x=>x.persistent === true &&
    x.accountAuthenticated === false && x.windowsDriverVerified === false));
});

test("private box setup plan uses only exact non-destructive persistent settings", () => {
  const result = planOwnedMinecraftProfiles(["DefaultBox","MinecraftClient02"]);
  assert.equal(result.commands.length, 12);
  assert.equal(result.hostChanged, false);
  assert.equal(result.driverInstalled, false);
  for(let i=0; i<3; i++){
    const steps=result.commands.slice(i*4, i*4+4);
    assert.deepEqual(steps.map(step=>step.arguments[2]),
      ["AutoDelete","AutoRemove","OpenCredentials","Enabled"]);
    assert.equal(steps[3].arguments[3],"y","enable the owned box only after configuration");
  }
  for(const cmd of result.commands) {
    assert.equal(cmd.executable, "SbieIni.exe");
    assert.deepEqual(cmd.arguments.slice(0,2), ["set",cmd.arguments[1]]);
    assert.ok(/^MivubiEdu0[234]$/.test(cmd.arguments[1]));
    assert.ok([["Enabled","y"],["AutoDelete","n"],
      ["AutoRemove","n"],["OpenCredentials","n"]]
      .some(([k,v])=>k===cmd.arguments[2]&&v===cmd.arguments[3]));
    assert.equal(cmd.arguments.length,4);
  }
});

test("existing named boxes never get silently reconfigured", () => {
  for(const names of [["MivubiEdu02"],["mivubiedu03"],["MivubiEdu04"],
    ["MinecraftClient02","minecraftclient02"]]) {
    assert.throws(()=>planOwnedMinecraftProfiles(names));
  }
  for(const invalid of [null,"MivubiEdu02",["bad name"],["../DefaultBox"]]) {
    assert.throws(()=>planOwnedMinecraftProfiles(invalid));
  }
});

test("owned Start launch selects only one exact profile and Education EXE",()=>{
  for(const id of ["02","03","04"]) {
    const exe = "C:\\Program Files\\Microsoft Studios\\Minecraft Education\\Minecraft.Windows.exe";
    const out = ownedMinecraftLaunch(id,exe);
    assert.equal(out.box,"MivubiEdu"+id);
    assert.deepEqual(out.arguments,["/mivubi_client:"+id,exe]);
    assert.equal(out.rawCommandLine,'/mivubi_client:'+id+' "'+exe+'"');
    assert.equal(out.driverInstalled,false);
    assert.equal(out.gameplayVerified,false);
  }
  for(const path of [
    "C:\\MinecraftEducation.exe","D:\\Apps\\MinecraftEducationEdition.exe",
  ]) {
    assert.equal(ownedMinecraftLaunch("02",path).arguments[1],path);
  }
});

test("rejects arbitrary code, paths, client IDs, UNC, args, and shell",()=>{
  const valid="C:\\Minecraft.Windows.exe";
  for(const id of ["01","05","2","03 ","__proto__",2,null]) {
    assert.throws(()=>ownedMinecraftLaunch(id,valid));
  }
  for(const path of [
    "minecraft.windows.exe","..\\Minecraft.Windows.exe",
    "\\\\server\\Minecraft.Windows.exe","C:\\Minecraft.Windows.exe /silent",
    "C:\\Minecraft.Windows.exe\" /terminate_all",
    "C:\\Minecraft.Windows.exe\u0000",
    "C:\\Notepad.exe","C:\\foo\\..\\Minecraft.Windows.exe",
    "C:/Minecraft.Windows.exe","C:\\Minecraft.Windows.exe|powershell",
  ]) {
    assert.throws(()=>ownedMinecraftLaunch("02",path),path);
  }
});

test("control contract and owned Start parser share the same profile namespace",()=>{
  const source=readFileSync(new URL("../fork-overlay/apply-private-source.mjs",import.meta.url),"utf8");
  const policy=readFileSync(new URL("./mivubi_owned_start_policy.h",import.meta.url),"utf8");
  assert.match(source,/mivubi_owned_start_policy\.h/);
  assert.match(policy,/mivubi_client:/);
  assert.match(policy,/MivubiEdu02/);
  assert.match(policy,/MivubiEdu03/);
  assert.match(policy,/MivubiEdu04/);
  assert.match(policy,/MivubiParseOwnedStart/);
  assert.match(policy,/end\[1\] != L'/);
  assert.match(policy,/MinecraftEducationEdition\.exe/);
  assert.doesNotMatch(source,/SbieDrv2|SbieSvc2|disable.*signing/i);
});

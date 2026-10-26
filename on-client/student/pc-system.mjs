import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile);
const script=String.raw`
$ErrorActionPreference='Stop'
[Console]::OutputEncoding=[Text.UTF8Encoding]::new($false)
function Read-Section($action) {
  try { $data=& $action; @{status='ok';data=$data;measuredAt=[DateTime]::UtcNow.ToString('o')} }
  catch { @{status='unknown';reason=$(if($_.Exception -is [UnauthorizedAccessException] -or $_.FullyQualifiedErrorId -match 'AccessDenied|Unauthorized|PermissionDenied'){'일반 권한으로 읽을 수 없습니다.'}else{'Windows 조회를 완료하지 못했습니다. 권한 또는 해당 기능의 지원 여부를 확인하세요.'});measuredAt=[DateTime]::UtcNow.ToString('o')} }
}
$identity=[Security.Principal.WindowsIdentity]::GetCurrent()
$principal=[Security.Principal.WindowsPrincipal]::new($identity)
if($principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)){throw 'ELEVATED_PROCESS_NOT_ALLOWED'}
$network=Read-Section {
  $adapters=@(Get-NetAdapter -ErrorAction Stop)
  $configs=@(Get-NetIPConfiguration -ErrorAction Stop)
  @($adapters | ForEach-Object {
    $adapter=$_; $config=$configs | Where-Object InterfaceIndex -eq $adapter.ifIndex | Select-Object -First 1
    @{name=[string]$adapter.Name;status=[string]$adapter.Status;description=[string]$adapter.InterfaceDescription;addresses=@($config.IPv4Address.IPAddress)+@($config.IPv6Address.IPAddress);gateways=@($config.IPv4DefaultGateway.NextHop)+@($config.IPv6DefaultGateway.NextHop)}
  })
}
$firewall=Read-Section { @(Get-NetFirewallProfile -PolicyStore ActiveStore -ErrorAction Stop | ForEach-Object { @{name=[string]$_.Name;enabled=[string]$_.Enabled} }) }
$end=Get-Date; $start=$end.AddHours(-24)
$logs=@{}
foreach($name in @('System','Application')) {
  $logs[$name]=Read-Section {
    $null=Get-WinEvent -ListLog $name -ErrorAction Stop
    try { $events=@(Get-WinEvent -FilterHashtable @{LogName=$name;Level=2,3;StartTime=$start;EndTime=$end} -ErrorAction Stop) }
    catch { if($_.FullyQualifiedErrorId -like 'NoMatchingEventsFound*'){$events=@()}else{throw} }
    @{warnings=@($events | Where-Object Level -eq 3).Count;errors=@($events | Where-Object Level -eq 2).Count}
  }
}
@{source='actual';network=$network;firewall=$firewall;logs=$logs;windowStart=$start.ToUniversalTime().ToString('o');windowEnd=$end.ToUniversalTime().ToString('o')} | ConvertTo-Json -Depth 8 -Compress
`;
export async function readSystemStatus(){
  const unknown=reason=>({status:'unknown',reason,measuredAt:new Date().toISOString()});
  if(process.platform!=='win32')return {source:'actual',network:unknown('Windows 전용 조회입니다.'),firewall:unknown('Windows 전용 조회입니다.'),logs:{System:unknown('Windows 전용 조회입니다.'),Application:unknown('Windows 전용 조회입니다.')}};
  try {
    const {stdout}=await run('powershell.exe',['-NoLogo','-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')],{windowsHide:true,timeout:25000,maxBuffer:2*1024*1024,encoding:'utf8'});
    const result=JSON.parse(stdout.replace(/^\uFEFF/,''));
    if(result.source!=='actual'||!result.network||!result.firewall||!result.logs)throw Error();
    return result;
  }catch(error){
    const reason=error.stderr?.includes('ELEVATED_PROCESS_NOT_ALLOWED')?'관리자 권한으로 실행된 앱에서는 조회하지 않습니다. 일반 권한으로 실행하세요.':error.killed?'조회 제한 시간(25초)을 초과했습니다.':'Windows 조회 도구를 실행하지 못했습니다.';
    return {source:'actual',network:unknown(reason),firewall:unknown(reason),logs:{System:unknown(reason),Application:unknown(reason)}};
  }
}

import {getWorkspaceData} from "@/lib/app-service";
import {SettingsForm} from "@/components/settings-form";
import {defaultFormula} from "@/lib/finance";
export default async function Page(){const data=await getWorkspaceData("settings");const item=data.items[0];return <SettingsForm formula={data.defaults?.formula as typeof defaultFormula} version={item?.version} updatedAt={item?.updatedAt?String(item.updatedAt):undefined} updatedBy={item?.updatedByName?String(item.updatedByName):undefined}/>;}

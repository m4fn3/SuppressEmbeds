import {Plugin, registerPlugin} from 'enmity/managers/plugins'
import {Locale, React} from 'enmity/metro/common'
import {FormRow} from "enmity/components"
import {create} from 'enmity/patcher'
// @ts-ignore
import manifest, {name as plugin_name} from '../manifest.json'
import Settings from "./components/Settings"
import {getByProps} from "enmity/modules"
import {patchActionSheet} from "../../hook"
import {findInReactTree} from "enmity/utilities"
import {getIDByName} from "enmity/api/assets"

const MessageStore = getByProps("suppressEmbeds")
const LazyActionSheet = getByProps("openLazy", "hideActionSheet")

const Patcher = create('SuppressEmbeds')
const SuppressIcon = getIDByName("ic_close_circle_24px")

const SuppressEmbeds: Plugin = {
    ...manifest,
    onStart() {
        patchActionSheet(Patcher, "MessageLongPressActionSheet", (args, res) => {
            const meta = args[0]
            if (meta.message?.embeds?.length) {
                const finalLocation = findInReactTree(res, r => Array.isArray(r) && r.find(o => typeof o?.key === "string" && typeof o?.props?.message === "string"))
                if (!finalLocation) return
                const button = <FormRow
                    label={`Suppress Embeds`}
                    leading={<FormRow.Icon source={SuppressIcon}/>}
                    onPress={() => {
                        MessageStore.suppressEmbeds(meta.message.channel_id, meta.message.id)
                        LazyActionSheet.hideActionSheet()
                    }}
                />
                let elementCopyText = finalLocation.filter(b => b.props?.message === Locale.Messages.MESSAGE_ACTION_REPLY) // find an index to insert the button filtering by a localized string
                let pos = elementCopyText?.length ? Number(elementCopyText[0].key) + 1 : 2 // FormRow components start with index 1
                finalLocation.splice(pos, 0, button)
            }
        })
    },
    onStop() {
        Patcher.unpatchAll()
    }
    ,
    getSettingsPanel({settings}) {
        return <Settings settings={settings}/>
    }
}

registerPlugin(SuppressEmbeds)

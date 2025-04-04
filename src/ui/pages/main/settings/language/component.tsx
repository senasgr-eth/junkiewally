import i18n from "@/shared/locales/i18n";
import { useAppState } from "@/ui/states/appState";
import s from "./styles.module.scss";
import { ss } from "@/ui/utils";
import Tile from "@/ui/components/tile";

const Language = () => {
  const { updateAppState } = useAppState(ss(["updateAppState"]));

  const changeLanguage = async (lng: string) => {
    await i18n.changeLanguage(lng);
    await updateAppState({ language: lng });
    window.location.reload();
  };

  const newLanguage = (lng: string) => {
    return async () => {
      await changeLanguage(lng);
    };
  };

  return (
    <div className={s.languages}>
      <Tile label="English" onClick={newLanguage("en")} />
      <Tile label="Français by Jesus" onClick={newLanguage("fr")} />
      <Tile label="Русский" onClick={newLanguage("ru")} />
      <Tile label="Deutsch" onClick={newLanguage("de")} />
      <Tile label="Português" onClick={newLanguage("pt")} />
      <Tile label="Español by Aleks K1" onClick={newLanguage("es")} />
      <Tile label="Italiano by Aleks K1" onClick={newLanguage("it")} />
      <Tile label="中國人" onClick={newLanguage("ch")} />
      <Tile label="중국인" onClick={newLanguage("kr")} />
      <Tile label="Indonesian by Naroaj" onClick={newLanguage("id")} />
    </div>
  );
};

export default Language;

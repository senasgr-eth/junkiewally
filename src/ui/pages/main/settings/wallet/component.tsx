import { browserTabsCreate } from "@/shared/utils/browser";

import Tile from "@/ui/components/tile";
import { TileProps } from "@/ui/components/tile/component";

import { t } from "i18next";
import {
  ArrowsPointingOutIcon,
  GlobeAltIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import SettingsLayout from "@/ui/components/settings-layout";

const ICON_SIZE = 8;
const ICON_CN = `w-${ICON_SIZE} h-${ICON_SIZE}`;

const WalletSettings = () => {
  const expandView = async () => {
    await browserTabsCreate({
      url: "index.html",
    });
  };

  const items: TileProps[] = [
    {
      icon: <GlobeAltIcon className={ICON_CN} />,
      label: t("components.layout.network_settings"),
      link: "/pages/network-settings",
    },
    {
      icon: <UserIcon className={ICON_CN} />,
      label: t("settings.address_type"),
      link: "/pages/change-addr-type",
    },
    {
      icon: <ArrowsPointingOutIcon className={ICON_CN} />,
      label: t("settings.expand_view"),
      onClick: expandView,
    },
  ];

  return (
    <SettingsLayout>
      {items.map((i) => (
        <Tile key={i.label} {...i} />
      ))}
    </SettingsLayout>
  );
};

export default WalletSettings;
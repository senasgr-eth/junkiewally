import type { INewWalletProps, IWallet } from "@/shared/interfaces";
import { useControllersState } from "../states/controllerState";
import { useGetCurrentAccount, useWalletState } from "../states/walletState";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { t } from "i18next";
import { Network } from "junkcoinjs-lib";
import { ss } from "../utils";
import { useCallback } from "react";
import { produce } from "immer";
import { excludeKeysFromObj } from "@/shared/utils";

export const useClearSelectedAccountStats = () => {
  const { wallets, updateWalletState } = useWalletState(
    ss(["wallets", "updateWalletState", "selectedAccount", "selectedWallet"])
  );

  return useCallback(
    async (curWallets?: IWallet[]) => {
      if (!curWallets) curWallets = [...wallets];

      const newWallets = curWallets.map((i) => ({
        ...i,
        accounts: i.accounts.map((i) =>
          excludeKeysFromObj(i, [
            "balance",
            "inscriptionBalance",
            "inscriptionCounter",
          ])
        ),
      }));

      if (curWallets !== undefined) {
        return newWallets;
      } else {
        await updateWalletState({ wallets: newWallets });
      }
    },
    [wallets, updateWalletState]
  );
};

export const useCreateNewWallet = () => {
  const { wallets, updateWalletState } = useWalletState(
    ss(["wallets", "updateWalletState"])
  );
  const { walletController, keyringController, notificationController } =
    useControllersState(
      ss(["walletController", "keyringController", "notificationController"])
    );
  const clearSelected = useClearSelectedAccountStats();
  const navigate = useNavigate();

  return async (props: INewWalletProps) => {
    const wallet = await walletController.createNewWallet(props);
    const keyring = await keyringController.serializeKeyringById(wallet.id);
    const newWallets = (await clearSelected([...wallets, wallet]))!;

    await walletController.saveWallets({
      phrases: [{ id: wallet.id, phrase: props.payload, data: keyring }],
      wallets: newWallets,
    });

    await updateWalletState({
      wallets: newWallets,
      selectedAccount: 0,
      selectedWallet: newWallets.length - 1,
      vaultIsEmpty: false,
    });
    await notificationController.changedAccount();
    navigate("/");
  };
};

export const useCreateNewAccount = () => {
  const { updateWalletState, wallets, selectedWallet } = useWalletState(
    ss(["updateWalletState", "wallets", "selectedWallet"])
  );
  const { walletController, notificationController } = useControllersState(
    ss(["walletController", "notificationController"])
  );
  const clearSelected = useClearSelectedAccountStats();
  const navigate = useNavigate();

  return async (name?: string) => {
    const createdAccount = await walletController.createNewAccount(name);
    if (!createdAccount)
      throw new Error("Internal error: failed to create new account");

    if (selectedWallet === undefined)
      throw new Error("Internal error: failed to find selected account");

    let newWallets = produce(wallets, (draft) => {
      draft[0].accounts.push(createdAccount);
      draft[0].accounts = draft[0].accounts.map(
        (i, idx) => ({ ...i, id: idx })
      );
    });
    newWallets = (await clearSelected(newWallets))!;

    await walletController.saveWallets({
      wallets: newWallets,
    });

    await updateWalletState({
      wallets: newWallets,
      selectedAccount: newWallets[selectedWallet].accounts.length - 1,
    });

    await notificationController.changedAccount();
    navigate("/");
  };
};

export const useSwitchWallet = () => {
  const { wallets, updateWalletState, selectedWallet } = useWalletState(
    ss(["wallets", "updateWalletState", "selectedAccount", "selectedWallet"])
  );
  const { walletController, notificationController } = useControllersState(
    ss(["walletController", "notificationController"])
  );
  const clearSelected = useClearSelectedAccountStats();
  const navigate = useNavigate();

  return async (key: number) => {
    let newWallets = [...wallets];
    const wallet = wallets.find((f) => f.id === key);
    if (!wallet) return;
    if (wallets[key].accounts.filter((i) => !!i.address).length === 0) {
      const newAccounts = await walletController.loadAccountsData(
        wallet.id,
        wallet.accounts
      );
      newWallets = produce(wallets, (draft) => {
        draft[key].accounts = newAccounts;
      });
    }

    if (selectedWallet !== key) {
      newWallets = (await clearSelected(newWallets))!;
    }
    await updateWalletState({
      selectedWallet: wallet.id,
      selectedAccount: 0,
      wallets: newWallets,
    });
    await notificationController.changedAccount();
    navigate("/");
  };
};

export const useSwitchAccount = () => {
  const { updateWalletState, selectedAccount } = useWalletState(
    ss(["updateWalletState", "selectedAccount"])
  );
  const clearSelected = useClearSelectedAccountStats();
  const navigate = useNavigate();
  const { notificationController } = useControllersState(
    ss(["notificationController"])
  );

  return async (id: number) => {
    if (selectedAccount !== id) {
      await clearSelected();
      await updateWalletState({
        selectedAccount: id,
      });
      await notificationController.changedAccount();
    }

    navigate("/");
  };
};

export const useUpdateCurrentAccountBalance = () => {
  const { apiController } = useControllersState(ss(["apiController"]));

  const { updateSelectedAccount } = useWalletState(
    ss([
      "updateSelectedAccount",
      "selectedAccount",
      "selectedWallet",
      "wallets",
    ])
  );
  const currentAccount = useGetCurrentAccount();

  return useCallback(async () => {
    if (currentAccount?.address === undefined) return;

    const res = (await apiController.getAccountStats(
      currentAccount.address
    )) ?? { amount: 0, count: 0, balance: 0 };

    if (!res) return;

    await updateSelectedAccount({
      balance: res.balance,
      inscriptionCounter: res.amount / 10 ** 5,
      inscriptionBalance: res.amount / 10 ** 8,
    });
  }, [apiController, updateSelectedAccount, currentAccount?.address]);
};

export const useDeleteWallet = () => {
  const { walletController, notificationController } = useControllersState(
    (v) => ({
      walletController: v.walletController,
      notificationController: v.notificationController,
    })
  );
  const { updateWalletState } = useWalletState(ss(["updateWalletState"]));
  const { wallets } = useWalletState(ss(["wallets"]));

  return async (id: number) => {
    if (wallets.length === 1) {
      toast.error(t("hooks.wallet.last_wallet_error"));
      return;
    }

    const {
      wallets: newWallets,
      selectedAccount,
      selectedWallet,
    } = await walletController.deleteWallet(id);

    if (typeof selectedWallet === "undefined")
      throw Error("Internal Error: Selected wallet is not defined");

    if (
      newWallets[selectedWallet].accounts.filter((i) => !!i.address).length ===
      0
    ) {
      newWallets[selectedWallet].accounts =
        await walletController.loadAccountsData(
          selectedWallet,
          newWallets[selectedWallet].accounts
        );
    }
    await updateWalletState({
      wallets: newWallets,
      selectedAccount,
      selectedWallet,
    });
    await notificationController.changedAccount();
  };
};

export const useSwitchNetwork = () => {
  const navigate = useNavigate();
  const { selectedWallet } = useWalletState(ss(["selectedWallet"]));
  const { walletController } = useControllersState(ss(["walletController"]));

  return async (network: Network) => {
    if (selectedWallet === undefined) return;
    await walletController.switchNetwork(network);
    navigate("/");
  };
};

import React, { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { validateAddress, ValidationResult } from "@taquito/utils";
import { TransferParams } from "@taquito/taquito/dist/types/operations/types";
import { Tezos } from "@taquito/taquito";
import { NetworkContext } from "../Context";
import FaucetAccount from "../components/FaucetAccount";
import useFaucet from "../hooks/useFaucet";
import { Panic, Info } from "../components/Messages";

export default function Faucet() {
    const { network } = useContext(NetworkContext);
    const [panic, setPanic] = useState("");
    const [balanceRefresh, setBalanceRefresh] = useState(false);
    const {
        loading: faucetIsLoading,
        pkh: faucetPKH,
        balance: faucetBalance,
        error: faucetError
    } = useFaucet(network, balanceRefresh);
    const [info, setInfo] = useState("");

    const { register, handleSubmit, errors } = useForm<TransferParams>();

    const onSubmit = async (data: TransferParams) => {
        await transfer(data);
    };

    const transfer = async (p: TransferParams) => {
        try {
            const op = await Tezos.contract.transfer(p);
            setInfo(`operation ${op.hash} in progress`);
            await op.confirmation(1);
            setInfo(`operation ${op.hash} confirmed`);
            setBalanceRefresh(true);
        } catch (e) {
            setPanic(`oops something bad happened: ${JSON.stringify(e)}`);
        }
    };

    const showInfo = (message: string) => <Info>{message}</Info>;

    return (
        <div>
            {faucetIsLoading ? (
                <span className="spinner"></span>
            ) : faucetError ? (
                showInfo("Sorry, faucet could not be loaded :(")
            ) : (
                <div>
                    {panic && <Panic title="Operation error">{panic}</Panic>}
                    {info && showInfo(info)}
                    <FaucetAccount balance={faucetBalance} pkh={faucetPKH} />
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div>
                            <label className="block">
                                <span className="text-gray-700">Amount:</span>
                                <input
                                    className="block w-full mt-1 form-input"
                                    defaultValue={25}
                                    name="amount"
                                    ref={register({
                                        validate: value => value > 0
                                    })}
                                    type="number"
                                />
                                {errors.amount && (
                                    <p className="g-FormError" role="alert">
                                        Please enter an amount greater than 0
                                    </p>
                                )}
                            </label>
                        </div>
                        <div>
                            <label className="block">
                                <span className="text-gray-700">
                                    Destination address:
                                </span>
                                <input
                                    className="block w-full mt-1 form-input"
                                    aria-invalid={errors.to ? "true" : "false"}
                                    ref={register({
                                        validate: value =>
                                            validateAddress(value) ===
                                            ValidationResult.VALID
                                    })}
                                    name="to"
                                    placeholder="tz1xxx1234"
                                    type="text"
                                />
                                {errors.to && (
                                    <p className="g-FormError" role="alert">
                                        Please enter a valid address
                                    </p>
                                )}
                            </label>
                        </div>
                        <div className="f-Form_submit">
                            <button>Submit</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

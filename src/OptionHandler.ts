
import { addOptionsBoughtAction, addOptionsSoldAction } from "./helper";

import {
  OptionsBought,
  OptionsSold
} from "../generated/OptionExchange/OptionExchange";

export function handleOptionsBought(event: OptionsBought): void {
  addOptionsBoughtAction(event)
}

export function handleOptionsSold(event: OptionsSold): void {
  addOptionsSoldAction(event)
}

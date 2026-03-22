import type { Item } from "#/types";
import { replaceDiminish, replaceHighlight } from "#/utils/common-utils";
import { COLOR_MAP, RESPONSE_CONVERSION_MAP } from "./constants";
export default function Card({ item }: { item: Item }) {
	const {
		name,
		item_slot_type,
		shop_image_webp,
		properties: allProperties,
		cost,
		tooltip_sections,
	} = item;
	const { AbilityCooldown } = allProperties;
	return (
		<div
			className="flex flex-col w-70 rounded-md overflow-hidden"
			style={{
				background: COLOR_MAP[item_slot_type].description,
			}}
		>
			<div
				className="flex flex-col p-2.5"
				style={{ background: COLOR_MAP[item_slot_type].primary }}
			>
				<p className="font-extrabold">{name}</p>
				<p className="font-medium text-green-200">{cost}</p>
			</div>
			<img
				src={shop_image_webp}
				width={80}
				height={80}
				className="mx-auto mt-2"
				alt={name}
			/>

			{tooltip_sections?.map((stat) => {
				const { section_type, section_attributes } = stat;
				const hasCooldown = AbilityCooldown && +AbilityCooldown?.value > 0;
				return (
					<div
						key={stat.section_type}
						className={`${section_type === "innate" && "-ml-2"}`}
					>
						{section_type !== "innate" && (
							<div
								style={{ background: COLOR_MAP[item_slot_type].highlight }}
								className="px-2 py-1 flex justify-between"
							>
								{section_type}
								{hasCooldown && (
									<div className="flex items-center gap-1">
										<img
											src={AbilityCooldown.icon}
											height={15}
											width={15}
											alt="cooldown"
										/>
										{AbilityCooldown.value}
										{AbilityCooldown.postfix}
									</div>
								)}
							</div>
						)}
						{section_attributes?.map((property) => {
							const {
								loc_string,
								properties,
								important_properties,
								elevated_properties,
							} = property;
							const commonProps = {
								allProperties,
								background:
									section_type !== "innate"
										? COLOR_MAP[item_slot_type].highlight
										: "",
								fontColor: COLOR_MAP[item_slot_type].primary,
							};
							return (
								<div key={loc_string} className="w-full">
									{loc_string && (
										<div
											className="text-gray-300 my-1 p-2"
											dangerouslySetInnerHTML={{
												__html: replaceDiminish(replaceHighlight(loc_string)),
											}}
										/>
									)}
									<div className="flex flex-col mt-2 gap-0.5">
										{important_properties && (
											<RenderProperties
												itemProperties={important_properties}
												{...commonProps}
												className="gap-1"
											/>
										)}
										{properties && (
											<RenderProperties
												itemProperties={properties.filter(
													(val) => val !== "AbilityCooldown",
												)}
												{...commonProps}
											/>
										)}
										{elevated_properties && (
											<RenderProperties
												itemProperties={elevated_properties}
												{...commonProps}
											/>
										)}
									</div>
								</div>
							);
						})}
					</div>
				);
			})}
		</div>
	);
}

function RenderProperties({
	allProperties,
	itemProperties,
	background,
	fontColor,
	className,
}: {
	allProperties: Item["properties"];
	itemProperties: Array<string>;
	background?: string;
	fontColor: string;
	className?: string;
}) {
	return (
		<div className={`flex flex-1 ${className ?? ""}`}>
			{itemProperties.map((property) => {
				const displayProperty = allProperties[property];
				const {
					label,
					value,
					postfix,
					prefix,
					icon,
					tooltip_is_important,
					usage_flags,
					negative_attribute,
				} = displayProperty;
				const isConditional = usage_flags?.includes("ConditionallyApplied");
				const showPostfix =
					postfix &&
					value &&
					typeof value === "string" &&
					value?.slice(value?.length - postfix?.length) !== postfix;
				return (
					<div
						key={property}
						className={`flex flex-wrap justify-center gap-0.5 items-center p-2 flex-1 ${tooltip_is_important && "flex-col"}`}
						style={{ background }}
					>
						<div
							className={`flex ${tooltip_is_important ? "text-xl" : ""} ${negative_attribute ? "text-[#CE7A6F]" : ""}`}
						>
							{tooltip_is_important && icon && (
								<img alt={label} src={icon} width={20} height={20} />
							)}
							<span className="text-gray-300">
								{prefix && RESPONSE_CONVERSION_MAP[prefix]}
							</span>
							<b>{value}</b>
							{showPostfix && (
								<span
									className={`${negative_attribute ? "text-[#CE7A6F]" : "text-gray-400"}`}
								>
									{postfix}
								</span>
							)}
						</div>
						<span
							style={{
								color: tooltip_is_important ? fontColor : "#d1d5dc",
							}}
							className="text-center"
						>
							{label}
						</span>
						{isConditional && tooltip_is_important && (
							<p className="font-medium italic text-gray-300">Conditional</p>
						)}
					</div>
				);
			})}
		</div>
	);
}

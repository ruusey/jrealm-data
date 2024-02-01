package com.jrealm.data.constants;

public enum ItemSlot {
	// Player Item indces
	EQUIPMENT_0(0),
	EQUIPMENT_1(1),
	EQUIPMENT_2(2),
	EQUIPMENT_3(3),
	INV_0(4),
	INV_1(5),
	INV_2(6),
	INV_3(7),
	INV_4(8),
	INV_5(9),
	INV_6(10),
	INV_7(11),
	
	// Chest Item indeces
	CHEST_0(0),
	CHEST_1(1),
	CHEST_2(2),
	CHEST_3(3),
	CHEST_4(4),
	CHEST_5(5),
	CHEST_6(6),
	CHEST_7(7);
	
	private Integer logicalIdx;
	
	private ItemSlot(final int logicalIdx) {
		this.logicalIdx = logicalIdx;
	}
	
	public Integer getLogicalIdx() {
		return this.logicalIdx;
	}
}

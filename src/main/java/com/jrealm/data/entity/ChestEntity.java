package com.jrealm.data.entity;

import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "player_chest")
@NoArgsConstructor
@AllArgsConstructor
@Data
@Builder
public class ChestEntity extends TemporalEntity{
	private static final long serialVersionUID = 7607170635634825869L;

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer chestId;
	private String chestUuid;
	private Integer ordinal;
	@OneToMany(cascade = { CascadeType.ALL }, fetch = FetchType.EAGER, targetEntity = GameItemRefEntity.class)
	@JoinColumn(foreignKey = @javax.persistence.ForeignKey(javax.persistence.ConstraintMode.NO_CONSTRAINT))
	@Builder.Default
	private Set<GameItemRefEntity> items = new HashSet<>();

	@ManyToOne
	private PlayerAccountEntity ownerAccount;

	public void addItem(final GameItemRefEntity item) {
		item.setOwnerChest(this);
		this.items.add(item);
	}

	public boolean removeItem(final GameItemRefEntity item) {
		item.setOwnerChest(null);
		return this.items.remove(item);
	}

	@Override
	public int hashCode() {
		return Objects.hash(this.chestId, this.ordinal, this.items, this.chestUuid);
	}

	@Override
	public boolean equals(Object other) {
		ChestEntity cast = (ChestEntity) other;
		return (this.chestId == cast.getChestId()) && (this.ordinal == cast.getOrdinal()) && this.chestUuid.equals(cast.getChestUuid());
	}
}

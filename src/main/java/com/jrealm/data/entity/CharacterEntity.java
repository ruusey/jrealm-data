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
import javax.persistence.OneToOne;
import javax.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@Entity
@Table(name = "player_character")
@NoArgsConstructor
@AllArgsConstructor
@Data
@Builder
public class CharacterEntity extends TemporalEntity {
	private static final long serialVersionUID = -6906497561358089565L;
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer characterId;
	private String characterUuid;
	private Integer characterClass;
	
	@OneToOne(cascade = { CascadeType.PERSIST }, fetch = FetchType.EAGER, targetEntity = CharacterStatsEntity.class)
	@JoinColumn(foreignKey = @javax.persistence.ForeignKey(javax.persistence.ConstraintMode.NO_CONSTRAINT))
	private CharacterStatsEntity stats;
	
	@OneToMany(cascade = { CascadeType.PERSIST }, fetch = FetchType.EAGER, targetEntity = GameItemRefEntity.class)
	@JoinColumn(foreignKey = @javax.persistence.ForeignKey(javax.persistence.ConstraintMode.NO_CONSTRAINT))
	@Builder.Default
	private Set<GameItemRefEntity> items = new HashSet<>();
	
	@ManyToOne
	private PlayerAccountEntity ownerAccount;
	
	public void addItem(final GameItemRefEntity item) {
		item.setOwnerCharacter(this);
		this.items.add(item);
	}
	
	public boolean removeItem(final GameItemRefEntity item) {
		item.setOwnerCharacter(null);
		return this.items.remove(item);
	}
	
	public void setStats(final CharacterStatsEntity stats) {
		stats.setOwnerCharacter(this);
		this.stats = stats;
	}
	
	public void removeItems() {
		for(final GameItemRefEntity item : items) {
			item.setOwnerCharacter(null);
		}
		this.items.clear();
	}
	
	@Override
	public int hashCode() {
		return Objects.hash(characterId, characterUuid, characterClass, items, stats);
	}
	
	@Override
	public String toString() {
		return characterId+", "+this.characterClass+", "+this.characterUuid;
	}
}

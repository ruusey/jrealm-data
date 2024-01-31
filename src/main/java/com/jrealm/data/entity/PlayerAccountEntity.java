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
import javax.persistence.OneToMany;
import javax.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "player_account")
@NoArgsConstructor
@AllArgsConstructor
@Data
@Builder
public class PlayerAccountEntity {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer accountId;
	private String accountEmail;
	private String accountUuid;
	private String accountName;
	
	@OneToMany(cascade = { CascadeType.ALL }, fetch = FetchType.EAGER, targetEntity = ChestEntity.class)
	@JoinColumn(foreignKey = @javax.persistence.ForeignKey(javax.persistence.ConstraintMode.NO_CONSTRAINT))
	@Builder.Default
	private Set<ChestEntity> playerVault = new HashSet<>();
	
	@OneToMany(cascade = { CascadeType.ALL }, fetch = FetchType.EAGER, targetEntity = CharacterEntity.class)
	@JoinColumn(foreignKey = @javax.persistence.ForeignKey(javax.persistence.ConstraintMode.NO_CONSTRAINT))
	@Builder.Default
	private Set<CharacterEntity> characters = new HashSet<>();
	
	public void addChest(final ChestEntity chest) {
		chest.setOwnerAccount(this);
		this.playerVault.add(chest);
	}
	
	public void addCharacter(final CharacterEntity character) {
		character.setOwnerAccount(this);
		this.characters.add(character);
	}
	
	@Override
	public int hashCode() {
		return Objects.hash(accountId, accountEmail, accountUuid, accountName, playerVault, characters);
	}
	
	
	@Override
	public String toString() {
		return accountId+", "+this.accountEmail+", "+this.accountName;
	}
}

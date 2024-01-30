package com.jrealm.data.entity;

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
	private String accountGuid;
	private String accountName;
	
	@OneToMany(cascade = { CascadeType.ALL }, fetch = FetchType.EAGER, targetEntity = ChestEntity.class)
	@JoinColumn(foreignKey = @javax.persistence.ForeignKey(javax.persistence.ConstraintMode.NO_CONSTRAINT))
	private Set<ChestEntity> playerVault;
	
	@OneToMany(cascade = { CascadeType.ALL }, fetch = FetchType.EAGER, targetEntity = CharacterEntity.class)
	@JoinColumn(foreignKey = @javax.persistence.ForeignKey(javax.persistence.ConstraintMode.NO_CONSTRAINT))
	private Set<CharacterEntity> characters;
}
